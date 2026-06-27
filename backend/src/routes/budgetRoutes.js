const express = require('express')
const router = express.Router()
const budgetController = require('../controllers/budgetController')
const authMiddleware = require('../middleware/authMiddleware')

router.use(authMiddleware)

router.post('/', budgetController.setBudget)
router.get('/', budgetController.getBudgets)
router.delete('/:id', budgetController.deleteBudget)
router.get('/progress', budgetController.getBudgetProgress)

module.exports = router
