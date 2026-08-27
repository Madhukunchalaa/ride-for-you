const { sendPaymentReminder } = require('./whatsapp');
const SystemConfig = require('../models/SystemConfig');

/**
 * Sends a QR-based WhatsApp payment reminder to a rider.
 * For 'normal' type: sends UPI QR image + reminder text.
 * For 'warning'/'final': sends the existing recovery warning template (no QR).
 * @param {Object} rider - Rider document
 * @param {String} type - 'normal', 'warning', 'final'
 */
const sendAutomatedPaymentLink = async (rider, type = 'normal') => {
  try {
    // Fetch Dynamic Amount
    let weeklyRate = rider.rentalRate;
    if (!weeklyRate) {
      const config = await SystemConfig.findOne({ key: 'WEEKLY_RENTAL_AMOUNT' });
      weeklyRate = config ? config.value : 2000;
    }

    console.log(`🤖 Automated Reminder [${type}] to ${rider.whatsappNumber}...`);

    if (type === 'warning' || type === 'final') {
      // ── Recovery Warning: unchanged behaviour ──────────────────────────────
      await sendPaymentReminder(rider.whatsappNumber, {
        templateName: 'recovery_warning_v1',
        contentSid: process.env.TWILIO_CONTENT_SID,
        variables: {
          1: rider.name,
          2: rider.vehicleNumber,
          3: '7989776255'
        }
      });
    } else {
      // ── Normal Reminder: QR image + reminder text ──────────────────────────
      const formattedAmount = Number(weeklyRate).toLocaleString('en-IN');
      const qrImageUrl = process.env.QR_IMAGE_URL || 'https://rideforyouev.com/assets/upi_qr.png';
      const qrTemplateName = process.env.QR_TEMPLATE_NAME || 'qr_payment_reminder_v1';

      await sendPaymentReminder(rider.whatsappNumber, {
        templateName: qrTemplateName,
        headerImage: qrImageUrl,
        variables: {
          1: formattedAmount   // {{1}} = amount e.g. "1,925"
        }
      });
    }

    return true;
  } catch (err) {
    console.error(`❌ Automated Reminder Error [${type}]:`, err.message);
    return false;
  }
};

module.exports = { sendAutomatedPaymentLink };
