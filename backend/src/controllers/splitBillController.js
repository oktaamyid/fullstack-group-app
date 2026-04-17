const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/apiResponse');
const {
  createSplitBillSchema,
  updateSplitBillSchema,
  updateMemberStatusSchema,
} = require('../validators/splitBillValidator');

function allocateMemberAmounts(totalAmount, members) {
  const withCustomAmount = members.filter((member) => typeof member.amount === 'number');
  const withoutCustomAmount = members.filter((member) => typeof member.amount !== 'number');

  const allocatedCustom = withCustomAmount.reduce((sum, member) => sum + member.amount, 0);
  const remainder = totalAmount - allocatedCustom;

  if (remainder < 0) {
    throw new Error('Sum of custom member amounts cannot exceed total amount');
  }

  if (withoutCustomAmount.length === 0) {
    if (allocatedCustom !== totalAmount) {
      throw new Error('Sum of member amounts must match total amount');
    }

    return members.map((member) => ({
      friendName: member.friendName,
      amount: member.amount,
    }));
  }

  const evenShare = Math.floor(remainder / withoutCustomAmount.length);
  let leftovers = remainder % withoutCustomAmount.length;

  return members.map((member) => {
    if (typeof member.amount === 'number') {
      return {
        friendName: member.friendName,
        amount: member.amount,
      };
    }

    const extra = leftovers > 0 ? 1 : 0;
    leftovers -= extra;

    return {
      friendName: member.friendName,
      amount: evenShare + extra,
    };
  });
}

function resolveBillStatus(members) {
  const paidCount = members.filter((member) => member.status === 'PAID').length;

  if (paidCount === 0) return 'UNPAID';
  if (paidCount === members.length) return 'PAID';
  return 'PARTIALLY_PAID';
}

async function createSplitBill(req, res) {
  const validation = createSplitBillSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation failed', 422, {
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const { title, description, totalAmount, members } = validation.data;

  let memberAllocations;
  try {
    memberAllocations = allocateMemberAmounts(totalAmount, members);
  } catch (error) {
    return sendError(res, error.message, 422);
  }

  try {
    const created = await prisma.splitBill.create({
      data: {
        userId: req.user.id,
        title,
        description: description || null,
        totalAmount,
        members: {
          create: memberAllocations.map((member) => ({
            friendName: member.friendName,
            amount: member.amount,
          })),
        },
      },
      include: {
        members: true,
      },
    });

    return sendSuccess(res, { splitBill: created }, 'Split bill created successfully', 201);
  } catch (error) {
    return sendError(res, 'Failed to create split bill', 500, {
      error: error.message,
    });
  }
}

async function listSplitBills(req, res) {
  try {
    const splitBills = await prisma.splitBill.findMany({
      where: { userId: req.user.id },
      include: {
        members: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = splitBills.reduce(
      (acc, bill) => {
        const paidAmount = bill.members
          .filter((member) => member.status === 'PAID')
          .reduce((sum, member) => sum + member.amount, 0);
        const unpaidAmount = bill.totalAmount - paidAmount;

        acc.total += bill.totalAmount;
        acc.paid += paidAmount;
        acc.unpaid += unpaidAmount;

        return acc;
      },
      { total: 0, paid: 0, unpaid: 0 }
    );

    return sendSuccess(res, { splitBills, summary }, 'Split bills fetched successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch split bills', 500, {
      error: error.message,
    });
  }
}

async function getSplitBillById(req, res) {
  const splitBillId = Number(req.params.id);

  if (Number.isNaN(splitBillId)) {
    return sendError(res, 'Invalid split bill id', 400);
  }

  try {
    const splitBill = await prisma.splitBill.findFirst({
      where: {
        id: splitBillId,
        userId: req.user.id,
      },
      include: {
        members: true,
      },
    });

    if (!splitBill) {
      return sendError(res, 'Split bill not found', 404);
    }

    return sendSuccess(res, { splitBill }, 'Split bill fetched successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch split bill', 500, {
      error: error.message,
    });
  }
}

async function updateSplitBill(req, res) {
  const splitBillId = Number(req.params.id);

  if (Number.isNaN(splitBillId)) {
    return sendError(res, 'Invalid split bill id', 400);
  }

  const validation = updateSplitBillSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation failed', 422, {
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const existing = await prisma.splitBill.findFirst({
      where: {
        id: splitBillId,
        userId: req.user.id,
      },
      include: {
        members: true,
      },
    });

    if (!existing) {
      return sendError(res, 'Split bill not found', 404);
    }

    const nextTitle = validation.data.title ?? existing.title;
    const nextDescription = validation.data.description !== undefined ? validation.data.description : existing.description;
    const nextTotalAmount = validation.data.totalAmount ?? existing.totalAmount;
    const nextMembers = validation.data.members;

    let memberAllocations;
    if (nextMembers) {
      try {
        memberAllocations = allocateMemberAmounts(nextTotalAmount, nextMembers);
      } catch (error) {
        return sendError(res, error.message, 422);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (memberAllocations) {
        await tx.splitBillMember.deleteMany({ where: { splitBillId } });
      }

      const splitBill = await tx.splitBill.update({
        where: { id: splitBillId },
        data: {
          title: nextTitle,
          description: nextDescription || null,
          totalAmount: nextTotalAmount,
          ...(memberAllocations
            ? {
                members: {
                  create: memberAllocations.map((member) => ({
                    friendName: member.friendName,
                    amount: member.amount,
                  })),
                },
              }
            : {}),
        },
        include: {
          members: true,
        },
      });

      const status = resolveBillStatus(splitBill.members);
      if (splitBill.status !== status) {
        return tx.splitBill.update({
          where: { id: splitBillId },
          data: { status },
          include: { members: true },
        });
      }

      return splitBill;
    });

    return sendSuccess(res, { splitBill: updated }, 'Split bill updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update split bill', 500, {
      error: error.message,
    });
  }
}

async function updateSplitBillMemberStatus(req, res) {
  const splitBillId = Number(req.params.id);
  const memberId = Number(req.params.memberId);

  if (Number.isNaN(splitBillId) || Number.isNaN(memberId)) {
    return sendError(res, 'Invalid split bill or member id', 400);
  }

  const validation = updateMemberStatusSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation failed', 422, {
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const { status } = validation.data;

  try {
    const splitBill = await prisma.splitBill.findFirst({
      where: {
        id: splitBillId,
        userId: req.user.id,
      },
      include: {
        members: true,
      },
    });

    if (!splitBill) {
      return sendError(res, 'Split bill not found', 404);
    }

    const member = splitBill.members.find((item) => item.id === memberId);
    if (!member) {
      return sendError(res, 'Split bill member not found', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.splitBillMember.update({
        where: { id: memberId },
        data: {
          status,
          paidAt: status === 'PAID' ? new Date() : null,
        },
      });

      const refreshed = await tx.splitBill.findUnique({
        where: { id: splitBillId },
        include: { members: true },
      });

      const billStatus = resolveBillStatus(refreshed.members);

      return tx.splitBill.update({
        where: { id: splitBillId },
        data: {
          status: billStatus,
        },
        include: { members: true },
      });
    });

    return sendSuccess(res, { splitBill: updated }, 'Split bill member status updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update member status', 500, {
      error: error.message,
    });
  }
}

async function deleteSplitBill(req, res) {
  const splitBillId = Number(req.params.id);

  if (Number.isNaN(splitBillId)) {
    return sendError(res, 'Invalid split bill id', 400);
  }

  try {
    const existing = await prisma.splitBill.findFirst({
      where: {
        id: splitBillId,
        userId: req.user.id,
      },
    });

    if (!existing) {
      return sendError(res, 'Split bill not found', 404);
    }

    await prisma.splitBill.delete({
      where: {
        id: splitBillId,
      },
    });

    return sendSuccess(res, {}, 'Split bill deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete split bill', 500, {
      error: error.message,
    });
  }
}

module.exports = {
  createSplitBill,
  listSplitBills,
  getSplitBillById,
  updateSplitBill,
  updateSplitBillMemberStatus,
  deleteSplitBill,
};
