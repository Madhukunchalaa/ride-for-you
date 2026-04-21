const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-order', paymentController.createOrder);
router.post('/create-link', paymentController.createPaymentLink);
router.post('/verify', paymentController.verifyPayment);
router.post('/webhook', paymentController.webhookHandler);
router.get('/config-status', paymentController.getConfigStatus);

module.exports = router;
