const express = require('express')
const router = express.Router()
const debtController = require('../controllers/debtController')
const authMiddleware = require('../middleware/authMiddleware')

router.use(authMiddleware)

router.post('/', debtController.createDebt)
router.get('/', debtController.getDebts)
router.put('/:id', debtController.updateDebt)
router.delete('/:id', debtController.deleteDebt)
router.put('/:id/pay', debtController.payDebt)

module.exports = router
