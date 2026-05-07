const phonepe = require('../config/phonepe');
const { sendPaymentReminder } = require('./whatsapp');
const SystemConfig = require('../models/SystemConfig');

/**
 * Generates a PhonePe link and sends a WhatsApp reminder to a rider.
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
    
    const amountVal = weeklyRate * 100; // in paise

    // Create PhonePe Link
    const response = await phonepe.createPaymentLink({
      riderId: rider._id,
      amount: amountVal,
      mobileNumber: rider.whatsappNumber,
      description: `Weekly Rental [${type.toUpperCase()}] - ${rider.vehicleNumber} (Rider: ${rider.name})`
    });

    const paymentLink = `${process.env.BACKEND_URL || 'https://rideforyouev.com'}/api/payments/pay/${rider._id}`;
    rider.paymentLinkId = response.id;
    rider.paymentLinkUrl = response.url;

    // Send WhatsApp (Using Content API for consistency if available, otherwise fallback)
    // For automation, we usually use the APPROVED template (TWILIO_CONTENT_SID)
    const formattedDate = rider.returnDate ? new Date(rider.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A';

    console.log(`🤖 Automated Reminder [${type}] to ${rider.whatsappNumber}...`);

    await sendPaymentReminder(rider.whatsappNumber, { 
      templateName: (type === 'warning' || type === 'final') ? 'recovery_warning_v1' : 'payment_reminder_v1',
      contentSid: process.env.TWILIO_CONTENT_SID,
      variables: (type === 'warning' || type === 'final') ? {
        1: rider.name,
        2: rider.vehicleNumber,
        3: '7989776255' // Recovery Dept Contact
      } : {
        1: rider.name,
        2: rider.vehicleNumber,
        3: formattedDate,
        4: paymentLink
      }
    });

    return true;
  } catch (err) {
    console.error(`❌ Automated Reminder Error [${type}]:`, err.message);
    return false;
  }
};

module.exports = { sendAutomatedPaymentLink };
