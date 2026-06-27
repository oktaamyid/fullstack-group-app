const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { sendSuccess, sendError } = require("../utils/apiResponse");

// Create a new wallet
exports.createWallet = async (req, res) => {
  try {
    const userId = req.user.id
    const { name, balance, type } = req.body

    if (!name) {
      return sendError(res, 'Name is required', 400)
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId,
        name,
        balance: parseInt(balance) || 0,
        type: type || 'CASH'
      }
    })

    sendSuccess(res, { wallet }, 'Wallet created successfully', 201)
  } catch (error) {
    console.error('Error creating wallet:', error)
    sendError(res, 'Internal server error', 500)
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
    sendSuccess(res, { wallets }, 'Wallets retrieved successfully')
  } catch (error) {
    console.error('Error getting wallets:', error)
    sendError(res, 'Internal server error', 500)
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
      return sendError(res, 'Wallet not found', 404)
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingWallet.name,
        balance: balance !== undefined ? parseInt(balance) : existingWallet.balance,
        type: type || existingWallet.type
      }
    })

    sendSuccess(res, { wallet: updatedWallet }, 'Wallet updated successfully')
  } catch (error) {
    console.error('Error updating wallet:', error)
    sendError(res, 'Internal server error', 500)
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
      return sendError(res, 'Wallet not found', 404)
    }

    // Check if user has more than 1 wallet
    const walletCount = await prisma.wallet.count({
      where: { userId }
    })

    if (walletCount <= 1) {
      return sendError(res, 'Cannot delete the only wallet you have', 400)
    }

    await prisma.wallet.delete({
      where: { id: parseInt(id) }
    })

    sendSuccess(res, null, 'Wallet deleted successfully')
  } catch (error) {
    console.error('Error deleting wallet:', error)
    sendError(res, 'Internal server error', 500)
  }
}

// Transfer balance between wallets
exports.transferBalance = async (req, res) => {
  try {
    const userId = req.user.id
    const { fromWalletId, toWalletId, amount } = req.body

    if (!fromWalletId || !toWalletId || !amount) {
      return sendError(res, 'fromWalletId, toWalletId, and amount are required', 400)
    }

    const parsedAmount = parseInt(amount)
    if (parsedAmount <= 1) {
      return sendError(res, 'Amount must be greater than 0', 400)
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

    sendSuccess(res, null, 'Transfer successful')
  } catch (error) {
    console.error('Error transferring balance:', error)
    sendError(res, error.message || 'Error transferring balance', 400)
  }
}
