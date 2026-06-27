const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Create a new wallet
exports.createWallet = async (req, res) => {
  try {
    const userId = req.user.id
    const { name, balance, type } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId,
        name,
        balance: parseInt(balance) || 0,
        type: type || 'CASH'
      }
    })

    res.status(201).json({ message: 'Wallet created successfully', wallet })
  } catch (error) {
    console.error('Error creating wallet:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get all wallets for user
exports.getWallets = async (req, res) => {
  try {
    const userId = req.user.id
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    })
    res.json({ wallets })
  } catch (error) {
    console.error('Error getting wallets:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Update wallet
exports.updateWallet = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { name, balance, type } = req.body

    const existingWallet = await prisma.wallet.findFirst({
      where: { id: parseInt(id), userId }
    })

    if (!existingWallet) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingWallet.name,
        balance: balance !== undefined ? parseInt(balance) : existingWallet.balance,
        type: type || existingWallet.type
      }
    })

    res.json({ message: 'Wallet updated successfully', wallet: updatedWallet })
  } catch (error) {
    console.error('Error updating wallet:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Delete wallet
exports.deleteWallet = async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const existingWallet = await prisma.wallet.findFirst({
      where: { id: parseInt(id), userId }
    })

    if (!existingWallet) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    // Check if user has more than 1 wallet
    const walletCount = await prisma.wallet.count({
      where: { userId }
    })

    if (walletCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only wallet you have' })
    }

    await prisma.wallet.delete({
      where: { id: parseInt(id) }
    })

    res.json({ message: 'Wallet deleted successfully' })
  } catch (error) {
    console.error('Error deleting wallet:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Transfer balance between wallets
exports.transferBalance = async (req, res) => {
  try {
    const userId = req.user.id
    const { fromWalletId, toWalletId, amount } = req.body

    if (!fromWalletId || !toWalletId || !amount) {
      return res.status(400).json({ error: 'fromWalletId, toWalletId, and amount are required' })
    }

    const parsedAmount = parseInt(amount)
    if (parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' })
    }

    // Use transaction to ensure both wallets are updated or neither is
    await prisma.$transaction(async (tx) => {
      const fromWallet = await tx.wallet.findFirst({
        where: { id: parseInt(fromWalletId), userId }
      })

      const toWallet = await tx.wallet.findFirst({
        where: { id: parseInt(toWalletId), userId }
      })

      if (!fromWallet || !toWallet) {
        throw new Error('One or both wallets not found or do not belong to you')
      }

      if (fromWallet.balance < parsedAmount) {
        throw new Error('Insufficient balance in source wallet')
      }

      await tx.wallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: parsedAmount } }
      })

      await tx.wallet.update({
        where: { id: toWallet.id },
        data: { balance: { increment: parsedAmount } }
      })
      
      // Also create two transactions to record this transfer
      await tx.transaction.create({
        data: {
          userId,
          walletId: fromWallet.id,
          type: 'EXPENSE',
          amount: parsedAmount,
          category: 'Transfer',
          note: `Transfer to ${toWallet.name}`
        }
      })
      
      await tx.transaction.create({
        data: {
          userId,
          walletId: toWallet.id,
          type: 'INCOME',
          amount: parsedAmount,
          category: 'Transfer',
          note: `Transfer from ${fromWallet.name}`
        }
      })
    })

    res.json({ message: 'Transfer successful' })
  } catch (error) {
    console.error('Error transferring balance:', error)
    res.status(400).json({ error: error.message || 'Error transferring balance' })
  }
}
