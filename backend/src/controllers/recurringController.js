const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Calculate the next occurrence based on interval and current nextOccurrence
const calculateNextOccurrence = (currentDate, interval) => {
  const nextDate = new Date(currentDate)
  switch (interval) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
  }
  return nextDate
}

exports.calculateNextOccurrence = calculateNextOccurrence

// Create a new recurring transaction setup
exports.createRecurring = async (req, res) => {
  try {
    const userId = req.user.id
    const { walletId, type, amount, category, note, interval, firstOccurrence } = req.body

    if (!walletId || !type || !amount || !interval || !firstOccurrence) {
      return res.status(400).json({ error: 'walletId, type, amount, interval, and firstOccurrence are required' })
    }

    if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(interval)) {
      return res.status(400).json({ error: 'Invalid interval' })
    }

    const nextOccurrence = new Date(firstOccurrence)

    const recurring = await prisma.recurringTransaction.create({
      data: {
        userId,
        walletId: parseInt(walletId),
        type,
        amount: parseInt(amount),
        category,
        note,
        interval,
        nextOccurrence
      }
    })

    res.status(201).json({ message: 'Recurring transaction set up successfully', recurring })
  } catch (error) {
    console.error('Error creating recurring transaction:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get all recurring transactions for user
exports.getRecurring = async (req, res) => {
  try {
    const userId = req.user.id
    const recurrings = await prisma.recurringTransaction.findMany({
      where: { userId },
      include: { wallet: true },
      orderBy: { nextOccurrence: 'asc' }
    })
    res.json({ recurrings })
  } catch (error) {
    console.error('Error getting recurring transactions:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Pause or Resume a recurring transaction
exports.updateRecurringStatus = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { status } = req.body

    if (!['ACTIVE', 'PAUSED'].includes(status)) {
      return res.status(400).json({ error: 'status must be ACTIVE or PAUSED' })
    }

    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: parseInt(id), userId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Recurring transaction not found' })
    }

    const updated = await prisma.recurringTransaction.update({
      where: { id: parseInt(id) },
      data: { status }
    })

    res.json({ message: `Recurring transaction marked as ${status}`, recurring: updated })
  } catch (error) {
    console.error('Error updating recurring status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Delete a recurring transaction
exports.deleteRecurring = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: parseInt(id), userId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Recurring transaction not found' })
    }

    await prisma.recurringTransaction.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Recurring transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting recurring transaction:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Process recurring transactions for a specific user (Called on login)
exports.processRecurringTransactions = async (userId) => {
  try {
    const now = new Date()
    
    // Find all active recurring transactions that are due
    const dueTransactions = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        nextOccurrence: { lte: now }
      },
      include: { wallet: true }
    })

    if (dueTransactions.length === 0) return

    for (const rec of dueTransactions) {
      // Process it as many times as it has passed (e.g. user hasn't logged in for months)
      let currentOccurrence = new Date(rec.nextOccurrence)
      
      while (currentOccurrence <= now) {
        await prisma.$transaction(async (tx) => {
          // 1. Create the transaction
          await tx.transaction.create({
            data: {
              userId,
              walletId: rec.walletId,
              type: rec.type,
              amount: rec.amount,
              category: rec.category,
              note: rec.note ? `${rec.note} (Auto)` : 'Auto-recurring',
              createdAt: currentOccurrence
            }
          })

          // 2. Update wallet balance
          await tx.wallet.update({
            where: { id: rec.walletId },
            data: {
              balance: rec.type === 'INCOME' 
                ? { increment: rec.amount }
                : { decrement: rec.amount }
            }
          })
          
          // 3. Move currentOccurrence forward
          currentOccurrence = calculateNextOccurrence(currentOccurrence, rec.interval)
        })
      }

      // 4. Update the nextOccurrence in the DB
      await prisma.recurringTransaction.update({
        where: { id: rec.id },
        data: { nextOccurrence: currentOccurrence }
      })
    }
    
    console.log(`Processed ${dueTransactions.length} recurring configurations for user ${userId}`)
  } catch (error) {
    console.error('Error processing recurring transactions:', error)
  }
}
