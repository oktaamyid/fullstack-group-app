const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/apiResponse');
const { createTransactionSchema, updateTransactionSchema } = require('../validators/transactionValidator');

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function parseTransactionId(rawId) {
  const id = Number(rawId);
  return Number.isNaN(id) ? null : id;
}

function buildSummary(transactions) {
  return transactions.reduce(
    (acc, entry) => {
      if (entry.type === 'INCOME') {
        acc.totalIncome += entry.amount;
      } else {
        acc.totalExpense += entry.amount;
      }

      acc.netBalance = acc.totalIncome - acc.totalExpense;
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, netBalance: 0 }
  );
}

async function listTransactions(req, res) {
  const { type, category, search, limit } = req.query;
  const parsedLimit = Number(limit);
  const take = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : undefined;

  const where = {
    userId: req.user.id,
    ...(type === 'INCOME' || type === 'EXPENSE' ? { type } : {}),
    ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
    ...(search
      ? {
          OR: [
            { category: { contains: search, mode: 'insensitive' } },
            { note: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(take ? { take } : {}),
    });

    const summary = buildSummary(transactions);

    return sendSuccess(res, { transactions, summary }, 'Transactions fetched successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch transactions', 500, {
      error: error.message,
    });
  }
}

async function createTransaction(req, res) {
  const validation = createTransactionSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation failed', 422, {
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const payload = validation.data;

  try {
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        type: payload.type,
        amount: payload.amount,
        category: normalizeText(payload.category) || null,
        note: normalizeText(payload.note) || null,
        ...(payload.createdAt ? { createdAt: new Date(payload.createdAt) } : {}),
      },
    });

    return sendSuccess(res, { transaction }, 'Transaction created successfully', 201);
  } catch (error) {
    return sendError(res, 'Failed to create transaction', 500, {
      error: error.message,
    });
  }
}

async function updateTransaction(req, res) {
  const transactionId = parseTransactionId(req.params.id);
  if (!transactionId) {
    return sendError(res, 'Invalid transaction id', 400);
  }

  const validation = updateTransactionSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation failed', 422, {
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
      return sendError(res, 'Transaction not found', 404);
    }

    const payload = validation.data;
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(payload.type ? { type: payload.type } : {}),
        ...(payload.amount ? { amount: payload.amount } : {}),
        ...(payload.category !== undefined ? { category: normalizeText(payload.category) || null } : {}),
        ...(payload.note !== undefined ? { note: normalizeText(payload.note) || null } : {}),
        ...(payload.createdAt ? { createdAt: new Date(payload.createdAt) } : {}),
      },
    });

    return sendSuccess(res, { transaction }, 'Transaction updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update transaction', 500, {
      error: error.message,
    });
  }
}

async function deleteTransaction(req, res) {
  const transactionId = parseTransactionId(req.params.id);
  if (!transactionId) {
    return sendError(res, 'Invalid transaction id', 400);
  }

  try {
    const existing = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return sendError(res, 'Transaction not found', 404);
    }

    await prisma.transaction.delete({ where: { id: transactionId } });

    return sendSuccess(res, {}, 'Transaction deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete transaction', 500, {
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
