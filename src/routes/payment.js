const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const customPaymentController = require('../controllers/customPaymentController');

router.post('/create-link', paymentController.createPaymentLink);
router.post('/webhook', paymentController.webhookHandler);
router.get('/config-status', paymentController.getConfigStatus);
router.get('/pay/:riderId', paymentController.redirectPayment);
router.get('/pay/custom/:paymentId', paymentController.redirectCustomPayment);
router.get('/callback', paymentController.paymentCallback);

// Custom/Ad-hoc Payments Tracker API
router.get('/custom', customPaymentController.getCustomPayments);
router.post('/custom', customPaymentController.createCustomPayment);
router.patch('/custom/:id', customPaymentController.updateCustomPaymentStatus);
router.delete('/custom/:id', customPaymentController.deleteCustomPayment);

module.exports = router;
