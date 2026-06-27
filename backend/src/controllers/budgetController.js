const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { sendSuccess, sendError } = require("../utils/apiResponse");

// Set a new budget for a category in a specific month/year
exports.setBudget = async (req, res) => {
  try {
    const userId = req.user.id
    const { category, amount, month, year } = req.body

    if (!category || !amount || !month || !year) {
      return sendError(res, 'category, amount, month, and year are required', 400)
    }

    const parsedMonth = parseInt(month)
    const parsedYear = parseInt(year)
    const parsedAmount = parseInt(amount)

    if (parsedMonth < 1 || parsedMonth > 12) {
      return sendError(res, 'Month must be between 1 and 12', 400)
    }

    // Upsert budget to avoid duplicates
    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId,
          category,
          month: parsedMonth,
          year: parsedYear
        }
      },
      update: {
        amount: parsedAmount
      },
      create: {
        userId,
        category,
        amount: parsedAmount,
        month: parsedMonth,
        year: parsedYear
      }
    })

    sendSuccess(res, { budget }, 'Budget set successfully', 200)
  } catch (error) {
    console.error('Error setting budget:', error)
    sendError(res, 'Internal server error', 500)
  }
}

// Get budgets for a specific month/year
exports.getBudgets = async (req, res) => {
  try {
    const userId = req.user.id
    const { month, year } = req.query

    const whereClause = { userId }
    if (month) whereClause.month = parseInt(month)
    if (year) whereClause.year = parseInt(year)

    const budgets = await prisma.budget.findMany({
      where: whereClause,
      orderBy: { category: 'asc' }
    })
    sendSuccess(res, { budgets }, 'Budgets retrieved successfully')
  } catch (error) {
    console.error('Error getting budgets:', error)
    sendError(res, 'Internal server error', 500)
  }
}

// Delete a budget
exports.deleteBudget = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const existingBudget = await prisma.budget.findFirst({
      where: { id: parseInt(id), userId }
    })

    if (!existingBudget) {
      return sendError(res, 'Budget not found', 404)
    }

    await prisma.budget.delete({
      where: { id: parseInt(id) }
    })

    sendSuccess(res, null, 'Budget deleted successfully')
  } catch (error) {
    console.error('Error deleting budget:', error)
    sendError(res, 'Internal server error', 500)
  }
}

// Get budget progress (calculate spent amount against budget)
exports.getBudgetProgress = async (req, res) => {
  try {
    const userId = req.user.id
    const month = parseInt(req.query.month) || new Date().getMonth() + 1
    const year = parseInt(req.query.year) || new Date().getFullYear()

    // Get all budgets for the month
    const budgets = await prisma.budget.findMany({
      where: { userId, month, year }
    })

    // Get all expense transactions for this month
    // We need to calculate start and end of the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ['EXPENSE', 'SHARED_EXPENSE'] },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate spent per category
    const spentPerCategory = {}
    transactions.forEach(tx => {
      const cat = tx.category || 'Uncategorized'
      if (!spentPerCategory[cat]) spentPerCategory[cat] = 0
      spentPerCategory[cat] += tx.amount
    })

    // Merge budgets with spent data
    const progress = budgets.map(b => {
      const spent = spentPerCategory[b.category] || 0
      return {
        ...b,
        spent,
        remaining: b.amount - spent,
        percentage: Math.min(100, Math.round((spent / b.amount) * 100))
      }
    })

    // Add categories that have spending but no budget
    for (const [cat, spent] of Object.entries(spentPerCategory)) {
      if (!budgets.find(b => b.category === cat)) {
        progress.push({
          id: `unbudgeted-${cat}`,
          category: cat,
          amount: 0,
          spent,
          remaining: -spent,
          percentage: 100,
          isUnbudgeted: true
        })
      }
    }

    sendSuccess(res, { month, year, progress }, 'Budget progress retrieved successfully')
  } catch (error) {
    console.error('Error getting budget progress:', error)
    sendError(res, 'Internal server error', 500)
  }
}
