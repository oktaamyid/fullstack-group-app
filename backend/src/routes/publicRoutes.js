const express = require('express');
const splitBillController = require('../controllers/splitBillController');

const router = express.Router();

router.get('/split-bills/:id', splitBillController.getSplitBillByIdPublic);

module.exports = router;
