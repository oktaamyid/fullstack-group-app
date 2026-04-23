const { prisma } = require('../config/prisma');
const { sendError, sendSuccess } = require('../utils/apiResponse');

function startOfDay(date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date).toUpperCase();
}

function detectCategory(title = '') {
  const value = title.toLowerCase();

  // Food & Drinks keywords
  if (
    value.includes('food') ||
    value.includes('cafe') ||
    value.includes('coffee') ||
    value.includes('makan') ||
    value.includes('pizza') ||
    value.includes('restaurant') ||
    value.includes('lunch') ||
    value.includes('dinner') ||
    value.includes('breakfast') ||
    value.includes('eat') ||
    value.includes('snack') ||
    value.includes('drink') ||
    value.includes('beverage')
  ) {
    return 'Food & Drinks';
  }

  // Transport keywords
  if (
    value.includes('transport') ||
    value.includes('bus') ||
    value.includes('metro') ||
    value.includes('ticket') ||
    value.includes('grab') ||
    value.includes('taxi') ||
    value.includes('train') ||
    value.includes('flight') ||
    value.includes('car') ||
    value.includes('ride') ||
    value.includes('travel')
  ) {
    return 'Transport';
  }

  // Education keywords
  if (
    value.includes('book') ||
    value.includes('library') ||
    value.includes('tuition') ||
    value.includes('school') ||
    value.includes('university') ||
    value.includes('exam') ||
    value.includes('course') ||
    value.includes('class') ||
    value.includes('study') ||
    value.includes('academic')
  ) {
    return 'Education';
  }

  // Living keywords
  if (
    value.includes('rent') ||
    value.includes('kost') ||
    value.includes('room') ||
    value.includes('apartment') ||
    value.includes('house') ||
    value.includes('utility') ||
    value.includes('electricity') ||
    value.includes('water') ||
    value.includes('internet')
  ) {
    return 'Living';
  }

  // Entertainment keywords
  if (
    value.includes('movie') ||
    value.includes('cinema') ||
    value.includes('game') ||
    value.includes('entertainment') ||
    value.includes('fun') ||
    value.includes('concert') ||
    value.includes('show') ||
    value.includes('party') ||
    value.includes('karaoke')
  ) {
    return 'Entertainment';
  }

  // Shopping keywords
  if (
    value.includes('shop') ||
    value.includes('grocery') ||
    value.includes('mall') ||
    value.includes('store') ||
    value.includes('buy') ||
    value.includes('purchase') ||
    value.includes('clothes') ||
    value.includes('apparel')
  ) {
    return 'Shopping';
  }

  return 'Other';
}

function buildWeeklyTrend(splitBills, days = 6) {
  const today = startOfDay(new Date());
  const points = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);

    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const amount = splitBills
      .filter((bill) => bill.createdAt >= dayStart && bill.createdAt < dayEnd)
      .reduce((sum, bill) => sum + bill.totalAmount, 0);

    points.push({
      day: formatDayLabel(day),
      amount,
    });
  }

  return points;
}

function buildWeeklyTrendFromTransactions(transactions, days = 6) {
  const today = startOfDay(new Date());
  const points = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);

    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const amount = transactions
      .filter((entry) => entry.type === 'EXPENSE' && entry.createdAt >= dayStart && entry.createdAt < dayEnd)
      .reduce((sum, entry) => sum + entry.amount, 0);

    points.push({
      day: formatDayLabel(day),
      amount,
    });
  }

  return points;
}

async function getAnalyticsOverview(req, res) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const splitBills = await prisma.splitBill.findMany({
      where: { userId: req.user.id },
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });

    const hasTransactions = transactions.length > 0;

    const expenseTransactions = transactions.filter((entry) => entry.type === 'EXPENSE');
    const incomeTransactions = transactions.filter((entry) => entry.type === 'INCOME');

    const totalSpentFromTransactions = expenseTransactions.reduce((sum, entry) => sum + entry.amount, 0);
    const totalIncomeFromTransactions = incomeTransactions.reduce((sum, entry) => sum + entry.amount, 0);

    const totalSpent = splitBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const weeklyTrend = hasTransactions
      ? buildWeeklyTrendFromTransactions(transactions, 6)
      : buildWeeklyTrend(splitBills, 6);
    const weeklyTotal = weeklyTrend.reduce((sum, point) => sum + point.amount, 0);
    const averageDaily = Math.round(weeklyTotal / Math.max(weeklyTrend.length, 1));

    const categoryTotals = hasTransactions
      ? expenseTransactions.reduce((acc, entry) => {
          const category = entry.category || 'Other';
          acc[category] = (acc[category] || 0) + entry.amount;
          return acc;
        }, {})
      : splitBills.reduce((acc, bill) => {
          const category = detectCategory(bill.title);
          acc[category] = (acc[category] || 0) + bill.totalAmount;
          return acc;
        }, {});

    const effectiveTotalSpent = hasTransactions ? totalSpentFromTransactions : totalSpent;

    const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry ? topCategoryEntry[0] : 'No Data';
    const topCategoryPercent = topCategoryEntry && effectiveTotalSpent > 0 ? Math.round((topCategoryEntry[1] / effectiveTotalSpent) * 100) : 0;

    const paidAmount = splitBills.reduce((sum, bill) => {
      const paidByMembers = bill.members
        .filter((member) => member.status === 'PAID')
        .reduce((subtotal, member) => subtotal + member.amount, 0);

      return sum + paidByMembers;
    }, 0);

    const savingsGoalTarget = 200000;
    const achieved = hasTransactions ? Math.max(0, totalIncomeFromTransactions - totalSpentFromTransactions) : paidAmount;
    const savingsGoalProgress = Math.min(100, Math.round((achieved / savingsGoalTarget) * 100));

    const recentReports = hasTransactions
      ? transactions.slice(0, 5).map((entry) => ({
          id: entry.id,
          title: entry.note || `${entry.type === 'INCOME' ? 'Income' : 'Expense'} Transaction`,
          date: entry.createdAt,
          amount: entry.amount,
          status: 'POSTED',
          category: entry.category || 'Other',
          type: entry.type,
        }))
      : splitBills.slice(0, 5).map((bill) => ({
          id: bill.id,
          title: bill.title,
          date: bill.createdAt,
          amount: bill.totalAmount,
          status: bill.status,
          category: detectCategory(bill.title),
          type: 'EXPENSE',
        }));

    return sendSuccess(
      res,
      {
        totals: {
          totalSpent: effectiveTotalSpent,
          averageDaily,
          weeklyTotal,
          totalIncome: totalIncomeFromTransactions,
          netBalance: hasTransactions ? totalIncomeFromTransactions - totalSpentFromTransactions : 0,
        },
        topCategory: {
          name: topCategory,
          percent: topCategoryPercent,
        },
        categoryBreakdown: Object.entries(categoryTotals)
          .map(([category, amount]) => ({
            category,
            amount,
            percent: effectiveTotalSpent > 0 ? Math.round((amount / effectiveTotalSpent) * 100) : 0,
          }))
          .sort((a, b) => b.amount - a.amount),
        savingsGoal: {
          target: savingsGoalTarget,
          achieved,
          progress: savingsGoalProgress,
        },
        weeklyTrend,
        recentReports,
      },
      'Analytics overview fetched successfully'
    );
  } catch (error) {
    return sendError(res, 'Failed to fetch analytics overview', 500, {
      error: error.message,
    });
  }
}

module.exports = {
  getAnalyticsOverview,
};
