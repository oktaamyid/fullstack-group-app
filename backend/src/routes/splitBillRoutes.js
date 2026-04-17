const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const splitBillController = require('../controllers/splitBillController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', splitBillController.listSplitBills);
router.get('/:id', splitBillController.getSplitBillById);
router.post('/', splitBillController.createSplitBill);
router.put('/:id', splitBillController.updateSplitBill);
router.patch('/:id/members/:memberId/status', splitBillController.updateSplitBillMemberStatus);
router.delete('/:id', splitBillController.deleteSplitBill);

module.exports = router;
