const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Create new debt/loan
exports.createDebt = async (req, res) => {
  try {
    const userId = req.user.id
    const { personName, amount, type, dueDate } = req.body

    if (!personName || !amount || !type) {
      return res.status(400).json({ error: 'personName, amount, and type are required' })
    }

    if (type !== 'DEBT' && type !== 'LOAN') {
      return res.status(400).json({ error: 'type must be DEBT or LOAN' })
    }

    const debt = await prisma.debt.create({
      data: {
        userId,
        personName,
        amount: parseInt(amount),
        type,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    })

    res.status(201).json({ message: 'Debt record created successfully', debt })
  } catch (error) {
    console.error('Error creating debt:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get all debts
exports.getDebts = async (req, res) => {
  try {
    const userId = req.user.id
    const { type, status } = req.query

    const whereClause = { userId }
    if (type) whereClause.type = type
    if (status) whereClause.status = status

    const debts = await prisma.debt.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })
    res.json({ debts })
  } catch (error) {
    console.error('Error getting debts:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Update debt
exports.updateDebt = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { personName, amount, type, dueDate } = req.body

    const existingDebt = await prisma.debt.findFirst({
      where: { id: parseInt(id), userId }
    })

    if (!existingDebt) {
      return res.status(404).json({ error: 'Debt not found' })
    }

    const updatedDebt = await prisma.debt.update({
      where: { id: parseInt(id) },
      data: {
        personName: personName || existingDebt.personName,
        amount: amount !== undefined ? parseInt(amount) : existingDebt.amount,
        type: type || existingDebt.type,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingDebt.dueDate
      }
    })

    res.json({ message: 'Debt updated successfully', debt: updatedDebt })
  } catch (error) {
    console.error('Error updating debt:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Delete debt
exports.deleteDebt = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const existingDebt = await prisma.debt.findFirst({
      where: { id: parseInt(id), userId }
    })

    if (!existingDebt) {
      return res.status(404).json({ error: 'Debt not found' })
    }

    await prisma.debt.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Debt deleted successfully' })
  } catch (error) {
    console.error('Error deleting debt:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Mark debt as paid (optional transaction integration)
exports.payDebt = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { walletId } = req.body // If provided, create a transaction for the payment

    const existingDebt = await prisma.debt.findFirst({
      where: { id: parseInt(id), userId }
    })

    if (!existingDebt) {
      return res.status(404).json({ error: 'Debt not found' })
    }

    if (existingDebt.status === 'PAID') {
      return res.status(400).json({ error: 'Debt is already marked as paid' })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Mark debt as paid
      await tx.debt.update({
        where: { id: parseInt(id) },
        data: { status: 'PAID' }
      })

      // 2. Create transaction and update wallet if walletId is provided
      if (walletId) {
        const wallet = await tx.wallet.findFirst({
          where: { id: parseInt(walletId), userId }
        })

        if (!wallet) {
          throw new Error('Wallet not found')
        }

        // If it was a DEBT (we owed someone), paying it is an EXPENSE
        // If it was a LOAN (someone owed us), paying it means we receive MONEY (INCOME)
        const txType = existingDebt.type === 'DEBT' ? 'EXPENSE' : 'INCOME'

        if (txType === 'EXPENSE' && wallet.balance < existingDebt.amount) {
          throw new Error('Insufficient balance to pay this debt')
        }

        await tx.transaction.create({
          data: {
            userId,
            walletId: parseInt(walletId),
            type: txType,
            amount: existingDebt.amount,
            category: existingDebt.type === 'DEBT' ? 'Debt Repayment' : 'Loan Repayment Received',
            note: `Payment for ${existingDebt.type.toLowerCase()} with ${existingDebt.personName}`
          }
        })

        await tx.wallet.update({
          where: { id: parseInt(walletId) },
          data: {
            balance: txType === 'EXPENSE' 
              ? { decrement: existingDebt.amount } 
              : { increment: existingDebt.amount }
          }
        })
      }
    })

    res.json({ message: 'Debt marked as paid successfully' })
  } catch (error) {
    console.error('Error paying debt:', error)
    res.status(400).json({ error: error.message || 'Error paying debt' })
  }
}
