const express = require('express')
const router = express.Router()
const walletController = require('../controllers/walletController')
const authMiddleware = require('../middleware/authMiddleware')

router.use(authMiddleware)

router.post('/', walletController.createWallet)
router.get('/', walletController.getWallets)
router.put('/:id', walletController.updateWallet)
router.delete('/:id', walletController.deleteWallet)
router.post('/transfer', walletController.transferBalance)

module.exports = router
