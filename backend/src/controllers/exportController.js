const { prisma } = require('../config/prisma');
const { sendError } = require('../utils/apiResponse');
const { Parser } = require('json2csv');

async function exportTransactionsCsv(req, res) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      include: { wallet: true },
      orderBy: { createdAt: 'desc' }
    });

    if (transactions.length === 0) {
      return sendError(res, 'No transactions found', 404);
    }

    const fields = ['id', 'type', 'amount', 'category', 'note', 'walletName', 'createdAt'];
    const opts = { fields };

    const data = transactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.note,
      walletName: t.wallet ? t.wallet.name : '-',
      createdAt: t.createdAt.toISOString()
    }));

    const parser = new Parser(opts);
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    return res.send(csv);
  } catch (error) {
    return sendError(res, 'Failed to export to CSV', 500, { error: error.message });
  }
}

module.exports = {
  exportTransactionsCsv
};
