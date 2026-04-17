const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.use(authMiddleware);
router.get('/overview', analyticsController.getAnalyticsOverview);

module.exports = router;
