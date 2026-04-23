const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const transactionController = require('../controllers/transactionController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', transactionController.listTransactions);
router.post('/', transactionController.createTransaction);
router.patch('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
