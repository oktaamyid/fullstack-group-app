const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { exportTransactionsCsv } = require('../controllers/exportController');

const router = express.Router();

router.use(authMiddleware);

router.get('/transactions/csv', exportTransactionsCsv);

module.exports = router;
