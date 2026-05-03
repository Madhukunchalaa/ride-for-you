const razorpay = require('../config/razorpay');
const { sendPaymentReminder } = require('./whatsapp');
const SystemConfig = require('../models/SystemConfig');

/**
 * Generates a Razorpay link and sends a WhatsApp reminder to a rider.
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
    const uniqueLinkId = `auto_${type}_${rider._id}_${Date.now()}`;

    // Create Razorpay Link
    const response = await razorpay.paymentLink.create({
      amount: amountVal,
      currency: "INR",
      accept_partial: false,
      description: `Weekly Rental [${type.toUpperCase()}] - ${rider.vehicleNumber} (Rider: ${rider.name})`,
      customer: {
        name: rider.name,
        contact: rider.whatsappNumber,
      },
      notify: { sms: false, email: false },
      notes: {
        riderId: rider._id.toString(),
        link_id: uniqueLinkId,
        automation_type: type
      },
      callback_url: `${process.env.FRONTEND_URL || 'https://rideforyouev.com'}/thank-you`,
      callback_method: "get"
    });

    const paymentLink = response.short_url;
    rider.paymentLinkId = response.id;

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
