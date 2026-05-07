const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-link', paymentController.createPaymentLink);
router.post('/webhook', paymentController.webhookHandler);
router.get('/config-status', paymentController.getConfigStatus);
router.get('/pay/:riderId', paymentController.redirectPayment);

module.exports = router;
