const express = require('express')
const router = express.Router()
const recurringController = require('../controllers/recurringController')
const authMiddleware = require('../middleware/authMiddleware')

router.use(authMiddleware)

router.post('/', recurringController.createRecurring)
router.get('/', recurringController.getRecurring)
router.put('/:id/status', recurringController.updateRecurringStatus)
router.delete('/:id', recurringController.deleteRecurring)

module.exports = router
