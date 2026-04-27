const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Twilio Webhook Endpoint
// Note: In production, we should use twilio.webhook() middleware for security
router.post('/webhook', express.urlencoded({ extended: false }), whatsappController.handleIncoming);
router.post('/bulk-reengage', whatsappController.sendBulkReengage);


module.exports = router;
