const { prisma } = require("../config/prisma");
const { sendError, sendSuccess } = require("../utils/apiResponse");
const {
  createTransactionSchema,
  updateTransactionSchema,
} = require("../validators/transactionValidator");

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : value;
}

function parseTransactionId(rawId) {
  const id = Number(rawId);
  return Number.isNaN(id) ? null : id;
}

function buildSummary(transactions) {
  return transactions.reduce(
    (acc, entry) => {
      if (entry.type === "INCOME") {
        acc.totalIncome += entry.amount;
      } else {
        acc.totalExpense += entry.amount;
      }

      acc.netBalance = acc.totalIncome - acc.totalExpense;
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, netBalance: 0 },
  );
}

async function listTransactions(req, res) {
  const { type, category, search, limit, walletId } = req.query;
  const parsedLimit = Number(limit);
  const take =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 100)
      : undefined;

  const where = {
    userId: req.user.id,
    ...(type === "INCOME" || type === "EXPENSE" || type === "SHARED_EXPENSE" ? { type } : {}),
    ...(category
      ? { category: { equals: category, mode: "insensitive" } }
      : {}),
    ...(search
      ? {
          OR: [
            { category: { contains: search, mode: "insensitive" } },
            { note: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(walletId ? { walletId: Number(walletId) } : {})
  };

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(take ? { take } : {}),
      include: { wallet: true }
    });

    const summary = buildSummary(transactions);

    return sendSuccess(
      res,
      { transactions, summary },
      "Transactions fetched successfully",
    );
  } catch (error) {
    return sendError(res, "Failed to fetch transactions", 500, {
      error: error.message,
    });
  }
}

async function createTransaction(req, res) {
  const validation = createTransactionSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, "Validation failed", 422, {
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const payload = validation.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true },
    });

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const wallet = await prisma.wallet.findFirst({
      where: { id: payload.walletId, userId: req.user.id }
    });

    if (!wallet) {
      return sendError(res, "Wallet not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: req.user.id,
          type: payload.type,
          amount: payload.amount,
          category: normalizeText(payload.category) || null,
          note: normalizeText(payload.note) || null,
          receiptImage: normalizeText(payload.receiptImage) || null,
          receiptImageName: normalizeText(payload.receiptImageName) || null,
          walletId: payload.walletId,
          ...(payload.createdAt ? { createdAt: payload.createdAt } : {}),
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: payload.walletId },
        data: {
          balance: payload.type === 'INCOME' 
            ? { increment: payload.amount } 
            : { decrement: payload.amount }
        }
      });

      return transaction;
    });

    return sendSuccess(
      res,
      { transaction: result },
      "Transaction created successfully",
      201,
    );
  } catch (error) {
    return sendError(res, "Failed to create transaction", 500, {
      error: error.message,
    });
  }
}

async function updateTransaction(req, res) {
  const transactionId = parseTransactionId(req.params.id);
  if (!transactionId) {
    return sendError(res, "Invalid transaction id", 400);
  }

  const validation = updateTransactionSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, "Validation failed", 422, {
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const existing = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return sendError(res, "Transaction not found", 404);
    }

    const payload = validation.data;
    const newWalletId = payload.walletId || existing.walletId;

    if (payload.walletId) {
      const walletCheck = await prisma.wallet.findFirst({
        where: { id: payload.walletId, userId: req.user.id }
      });
      if (!walletCheck) return sendError(res, "New Wallet not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Revert old wallet balance
      if (existing.walletId) {
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: {
            balance: existing.type === 'INCOME'
              ? { decrement: existing.amount }
              : { increment: existing.amount }
          }
        });
      }

      const transaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          ...(payload.type ? { type: payload.type } : {}),
          ...(payload.amount ? { amount: payload.amount } : {}),
          ...(payload.category !== undefined
            ? { category: normalizeText(payload.category) || null }
            : {}),
          ...(payload.note !== undefined
            ? { note: normalizeText(payload.note) || null }
            : {}),
          ...(payload.receiptImage !== undefined
            ? { receiptImage: normalizeText(payload.receiptImage) || null }
            : {}),
          ...(payload.receiptImageName !== undefined
            ? {
                receiptImageName: normalizeText(payload.receiptImageName) || null,
              }
            : {}),
          ...(payload.walletId ? { walletId: payload.walletId } : {}),
          ...(payload.createdAt ? { createdAt: payload.createdAt } : {}),
        },
      });

      // Apply new wallet balance
      if (newWalletId) {
        const newType = payload.type || existing.type;
        const newAmount = payload.amount || existing.amount;
        
        await tx.wallet.update({
          where: { id: newWalletId },
          data: {
            balance: newType === 'INCOME'
              ? { increment: newAmount }
              : { decrement: newAmount }
          }
        });
      }

      return transaction;
    });

    return sendSuccess(
      res,
      { transaction: result },
      "Transaction updated successfully",
    );
  } catch (error) {
    return sendError(res, "Failed to update transaction", 500, {
      error: error.message,
    });
  }
}

async function deleteTransaction(req, res) {
  const transactionId = parseTransactionId(req.params.id);
  if (!transactionId) {
    return sendError(res, "Invalid transaction id", 400);
  }

  try {
    const existing = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return sendError(res, "Transaction not found", 404);
    }

    await prisma.$transaction(async (tx) => {
      // Refund wallet balance
      if (existing.walletId) {
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: {
            balance: existing.type === 'INCOME'
              ? { decrement: existing.amount }
              : { increment: existing.amount }
          }
        });
      }

      await tx.transaction.delete({ where: { id: transactionId } });
    });

    return sendSuccess(res, {}, "Transaction deleted successfully");
  } catch (error) {
    return sendError(res, "Failed to delete transaction", 500, {
      error: error.message,
    });
  }
}

module.exports = {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
