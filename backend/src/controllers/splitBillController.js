const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/apiResponse');
const {
  createSplitBillSchema,
  updateSplitBillSchema,
  updateMemberStatusSchema,
} = require('../validators/splitBillValidator');

/**
 * Calculates member amounts from items
 * Based on which items each member has
 */
function calculateAmountsFromItems(items, members) {
  const memberAmounts = {};
  // initialize using string keys to support string clientIds
  members.forEach((m) => {
    memberAmounts[String(m.id)] = 0;
  });

  // For each item, divide its total price among assigned members
  items.forEach((item) => {
    const itemTotal = item.price * (item.quantity || 1);
    const assignedMemberIds = item.assignedTo || [];

    if (assignedMemberIds.length > 0) {
      const amountPerMember = Math.floor(itemTotal / assignedMemberIds.length);
      const remainder = itemTotal % assignedMemberIds.length;

      assignedMemberIds.forEach((memberId, index) => {
        const key = String(memberId);
        if (memberAmounts[key] === undefined) memberAmounts[key] = 0;
        memberAmounts[key] += amountPerMember + (index < remainder ? 1 : 0);
      });
    }
  });

  return memberAmounts;
}

/**
 * Validates member amounts sum equals total amount
 * Automatically detects if split is equal, custom, or item-based
 */
function validateAndPrepareMemberAllocations(totalAmount, members, items = null) {
  // If items provided, calculate from items
  if (items && items.length > 0) {
    // support members providing a clientId (string) or fallback to indices
    const memberIdentifiers = members.map((m, idx) => (m.clientId ? m.clientId : idx));
    const memberObjs = memberIdentifiers.map((id) => ({ id }));

    const memberAmounts = calculateAmountsFromItems(
      items.map((item) => item),
      memberObjs
    );

    const allocatedAmount = Object.values(memberAmounts).reduce((a, b) => a + b, 0);
    if (allocatedAmount !== totalAmount) {
      throw new Error(
        `Items total (${allocatedAmount}) must equal total amount (${totalAmount})`
      );
    }

    return {
      members: members.map((member, idx) => ({
        friendName: member.friendName,
        amount: memberAmounts[String(member.clientId ? member.clientId : idx)] || 0,
      })),
      divisionMethod: 'ITEM_BASED',
    };
  }

  // Otherwise, validate provided amounts
  const allocatedAmount = members.reduce((sum, member) => sum + (member.amount || 0), 0);

  if (allocatedAmount !== totalAmount) {
    throw new Error(
      `Total amount must equal sum of member amounts (expected ${totalAmount}, got ${allocatedAmount})`
    );
  }

  // Detect if this is an equal split (all amounts are the same)
  const amounts = members.map((m) => m.amount);
  const firstAmount = amounts[0];
  const isEqualSplit = amounts.every((amount) => amount === firstAmount);

  return {
    members: members.map((member) => ({
      friendName: member.friendName,
      amount: member.amount,
    })),
    divisionMethod: isEqualSplit ? 'EQUAL' : 'CUSTOM',
  };
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

  const { title, description, totalAmount, members, items, syncToPersonal } = validation.data;

  let memberData;
  let divisionMethod;
  try {
    const prepared = validateAndPrepareMemberAllocations(totalAmount, members, items);
    memberData = prepared.members;
    divisionMethod = prepared.divisionMethod;
  } catch (error) {
    return sendError(res, error.message, 422);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record if syncToPersonal
      let transactionId = null;
      if (syncToPersonal) {
        const transaction = await tx.transaction.create({
          data: {
            userId: req.user.id,
            type: 'EXPENSE',
            amount: totalAmount,
            category: title || 'Shared Expense',
            note: description || null,
          },
        });
        transactionId = transaction.id;
      }

      // Create split bill (without nested members/items)
      const createdBill = await tx.splitBill.create({
        data: {
          userId: req.user.id,
          title,
          description: description || null,
          totalAmount,
          divisionMethod,
          syncToPersonal,
          transactionId,
        },
      });

      // Create members explicitly to capture DB ids and allow client-side clientId mapping
      const createdMembers = [];
      for (const m of memberData) {
        const cm = await tx.splitBillMember.create({
          data: {
            splitBillId: createdBill.id,
            friendName: m.friendName,
            amount: m.amount,
          },
        });
        createdMembers.push(cm);
      }

      // Create items explicitly
      const createdItems = [];
      if (items && items.length > 0) {
        for (const item of items) {
          const ci = await tx.splitBillItem.create({
            data: {
              splitBillId: createdBill.id,
              itemName: item.itemName,
              price: item.price,
              quantity: item.quantity || 1,
            },
          });
          createdItems.push(ci);
        }

        // Create assignments: support client-side clientId strings or numeric indices
        // Build a map for clientId -> memberId if clientId provided in request members
        const clientIdToMemberId = {};
        members.forEach((m, idx) => {
          if (m.clientId) {
            clientIdToMemberId[m.clientId] = createdMembers[idx].id;
          }
        });

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const createdItem = createdItems[i];
          if (item.assignedTo && item.assignedTo.length > 0) {
            for (const assigned of item.assignedTo) {
              let memberIdToUse = null;
              if (typeof assigned === 'string') {
                memberIdToUse = clientIdToMemberId[assigned] || null;
              } else if (typeof assigned === 'number') {
                const member = createdMembers[assigned];
                memberIdToUse = member ? member.id : null;
              }

              if (memberIdToUse) {
                await tx.splitBillItemAssignment.create({
                  data: {
                    itemId: createdItem.id,
                    memberId: memberIdToUse,
                  },
                });
              }
            }
          }
        }
      }

      // Return full split bill with relations
      const final = await tx.splitBill.findUnique({
        where: { id: createdBill.id },
        include: { members: true, items: { include: { assignedTo: true } }, transaction: true },
      });

      return final;
    });

    return sendSuccess(res, { splitBill: result }, 'Split bill created successfully', 201);
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
        items: {
          include: {
            assignedTo: true,
          },
        },
        transaction: true,
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
        items: {
          include: {
            assignedTo: true,
          },
        },
        transaction: true,
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
        items: true,
      },
    });

    if (!existing) {
      return sendError(res, 'Split bill not found', 404);
    }

    const nextTitle = validation.data.title ?? existing.title;
    const nextDescription =
      validation.data.description !== undefined ? validation.data.description : existing.description;
    const nextTotalAmount = validation.data.totalAmount ?? existing.totalAmount;
    const nextSyncToPersonal = validation.data.syncToPersonal ?? existing.syncToPersonal;
    const nextMembers = validation.data.members;
    const nextItems = validation.data.items;

    const membersForValidation =
      nextMembers ||
      existing.members.map((member) => ({ friendName: member.friendName, amount: member.amount }));

    let memberData;
    let divisionMethod;
    try {
      const prepared = validateAndPrepareMemberAllocations(nextTotalAmount, membersForValidation, nextItems);
      memberData = prepared.members;
      divisionMethod = prepared.divisionMethod;
    } catch (error) {
      return sendError(res, error.message, 422);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (memberData) {
        await tx.splitBillMember.deleteMany({ where: { splitBillId } });
      }

      if (nextItems) {
        await tx.splitBillItemAssignment.deleteMany({
          where: {
            item: { splitBillId },
          },
        });
        await tx.splitBillItem.deleteMany({ where: { splitBillId } });
      }

      const splitBill = await tx.splitBill.update({
        where: { id: splitBillId },
        data: {
          title: nextTitle,
          description: nextDescription || null,
          totalAmount: nextTotalAmount,
          divisionMethod,
          syncToPersonal: nextSyncToPersonal,
          ...(memberData
            ? {
                members: {
                  create: memberData.map((member) => ({
                    friendName: member.friendName,
                    amount: member.amount,
                  })),
                },
              }
            : {}),
          ...(nextItems
            ? {
                items: {
                  create: nextItems.map((item) => ({
                    itemName: item.itemName,
                    price: item.price,
                    quantity: item.quantity || 1,
                  })),
                },
              }
            : {}),
        },
        include: {
          members: true,
          items: {
            include: {
              assignedTo: true,
            },
          },
          transaction: true,
        },
      });

      // Create item assignments if items exist
      if (nextItems) {
        const createdItems = await tx.splitBillItem.findMany({
          where: { splitBillId },
        });

        const billMembers = await tx.splitBillMember.findMany({
          where: { splitBillId },
        });

        // Build clientId -> memberId map if nextMembers provided
        const clientIdToMemberId = {};
        if (nextMembers) {
          nextMembers.forEach((m, idx) => {
            if (m.clientId) {
              const createdMember = splitBill.members && splitBill.members[idx];
              if (createdMember) clientIdToMemberId[m.clientId] = createdMember.id;
            }
          });
        }

        for (let i = 0; i < nextItems.length; i++) {
          const item = nextItems[i];
          const createdItem = createdItems.find((ci) => ci.itemName === item.itemName);
          if (createdItem && item.assignedTo && item.assignedTo.length > 0) {
            for (const assigned of item.assignedTo) {
              let memberIdToUse = null;
              if (typeof assigned === 'string') {
                memberIdToUse = clientIdToMemberId[assigned] || null;
              } else if (typeof assigned === 'number') {
                const member = billMembers[assigned];
                memberIdToUse = member ? member.id : null;
              }

              if (memberIdToUse) {
                await tx.splitBillItemAssignment.create({
                  data: {
                    itemId: createdItem.id,
                    memberId: memberIdToUse,
                  },
                });
              }
            }
          }
        }
      }

      const status = resolveBillStatus(splitBill.members);
      if (splitBill.status !== status) {
        return tx.splitBill.update({
          where: { id: splitBillId },
          data: { status },
            include: {
              members: true,
              items: {
                include: {
                  assignedTo: true,
                },
              },
              transaction: true,
            },
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

      // If syncToPersonal is enabled and member was just marked PAID, create an INCOME transaction
      if (refreshed.syncToPersonal && status === 'PAID') {
        await tx.transaction.create({
          data: {
            userId: req.user.id,
            type: 'INCOME',
            amount: member.amount,
            category: 'Split Bill Payment',
            note: `Payment from ${member.friendName} for ${refreshed.title}`,
          },
        });
      }

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
