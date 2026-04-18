const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/billing', analyticsController.getBillingStats);
router.get('/payments', analyticsController.getPaymentAnalytics);

module.exports = router;
