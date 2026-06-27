const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Set a new budget for a category in a specific month/year
exports.setBudget = async (req, res) => {
  try {
    const userId = req.user.id
    const { category, amount, month, year } = req.body

    if (!category || !amount || !month || !year) {
      return res.status(400).json({ error: 'category, amount, month, and year are required' })
    }

    const parsedMonth = parseInt(month)
    const parsedYear = parseInt(year)
    const parsedAmount = parseInt(amount)

    if (parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12' })
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

    res.status(200).json({ message: 'Budget set successfully', budget })
  } catch (error) {
    console.error('Error setting budget:', error)
    res.status(500).json({ error: 'Internal server error' })
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
    res.json({ budgets })
  } catch (error) {
    console.error('Error getting budgets:', error)
    res.status(500).json({ error: 'Internal server error' })
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
      return res.status(404).json({ error: 'Budget not found' })
    }

    await prisma.budget.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Budget deleted successfully' })
  } catch (error) {
    console.error('Error deleting budget:', error)
    res.status(500).json({ error: 'Internal server error' })
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

    res.json({ month, year, progress })
  } catch (error) {
    console.error('Error getting budget progress:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
