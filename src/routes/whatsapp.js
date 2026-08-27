const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Twilio Webhook Endpoint
router.post('/webhook', express.urlencoded({ extended: false }), whatsappController.handleIncoming);
router.post('/bulk-reengage', whatsappController.sendBulkReengage);
router.get('/logs', whatsappController.getReminderLogs);

// ── Manual QR Reminder Routes (used while auto reminders are paused) ──────────
// Send QR reminder to ONE specific rider:   POST /api/whatsapp/send-qr/:riderId
// Send QR reminder to ALL unpaid riders:    POST /api/whatsapp/send-qr-all
router.post('/send-qr/:riderId', whatsappController.sendQrReminder);
router.post('/send-qr-all', whatsappController.sendQrReminderToAll);

module.exports = router;

