const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding default wallets for existing users...')
  
  const users = await prisma.user.findMany({
    include: {
      wallets: true
    }
  })

  for (const user of users) {
    if (user.wallets.length === 0) {
      console.log(`Creating default wallet for user ${user.id}`)
      const wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          name: 'General Wallet',
          balance: 0,
          type: 'CASH'
        }
      })

      // Assign all existing transactions without a wallet to this wallet
      const txs = await prisma.transaction.updateMany({
        where: {
          userId: user.id,
          walletId: null
        },
        data: {
          walletId: wallet.id
        }
      })
      console.log(`Updated ${txs.count} transactions for user ${user.id}`)

      // Recalculate balance for this wallet
      const allTx = await prisma.transaction.findMany({
        where: { walletId: wallet.id }
      })
      
      let balance = 0
      for (const tx of allTx) {
        if (tx.type === 'INCOME') balance += tx.amount
        else balance -= tx.amount // EXPENSE or SHARED_EXPENSE
      }

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance }
      })
      console.log(`Updated wallet ${wallet.id} balance to ${balance}`)
    }
  }

  console.log('Seeding finished.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
