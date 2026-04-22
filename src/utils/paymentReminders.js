const axios = require('axios');
const { getCashfreeConfig } = require('../config/cashfree');
const { sendPaymentReminder } = require('./whatsapp');

/**
 * Generates a Cashfree link and sends a WhatsApp reminder to a rider.
 * @param {Object} rider - Rider document
 * @param {String} type - 'normal', 'warning', 'final'
 */
const sendAutomatedPaymentLink = async (rider, type = 'normal') => {
  try {
    const cashfreeConfig = await getCashfreeConfig();
    if (!cashfreeConfig.isConfigured) {
      console.error('❌ Skipping automated link: Cashfree not configured.');
      return;
    }

    const amountVal = rider.whatsappNumber === '7095682464' ? 1 : 2000;
    const uniqueLinkId = `auto_${type}_${rider._id}_${Date.now()}`;

    const payload = {
      link_id: uniqueLinkId,
      link_amount: amountVal,
      link_currency: "INR",
      link_purpose: `Rental Payment [${type.toUpperCase()}] - ${rider.vehicleNumber}`,
      customer_details: {
        customer_phone: rider.whatsappNumber,
        customer_name: rider.name.replace(/[^a-zA-Z\s.]/g, '') // Sanitize name for Cashfree
      },
      link_notify: { send_sms: false, send_email: false },
      link_meta: {
        return_url: `${process.env.FRONTEND_URL || 'https://rideforyouev.com'}/`,
        notify_url: `${process.env.FRONTEND_URL || 'https://ride-for-you-production.up.railway.app'}/api/payments/webhook`
      }
    };

    const response = await axios.post(`${cashfreeConfig.baseUrl}/links`, payload, {
      headers: {
        'x-client-id': cashfreeConfig.clientId,
        'x-client-secret': cashfreeConfig.clientSecret,
        'x-api-version': cashfreeConfig.apiVersion,
        'Content-Type': 'application/json'
      }
    });

    const paymentLink = response.data.link_url;
    rider.paymentLinkId = uniqueLinkId;

    let body = '';
    const returnDate = new Date(rider.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    if (type === 'normal') {
      body = `💳 *Payment Reminder - Ride For You*\n\nHello *${rider.name}*,\n\nYour rental payment for vehicle *${rider.vehicleNumber}* is due on *${returnDate}*.\n\n🔗 *Pay Now:* ${paymentLink}\n\nThank you! ⚡`;
    } else if (type === 'warning') {
      body = `⚠️ *URGENT: Payment Overdue - Ride For You*\n\nHello *${rider.name}*,\n\nYour payment for *${rider.vehicleNumber}* is now *3 days overdue*.\n\nPlease complete the payment immediately to avoid service interruption.\n\n🔗 *Pay Now:* ${paymentLink}`;
    } else if (type === 'final') {
      body = `🚨 *FINAL NOTICE: Recovery Action - Ride For You*\n\nHello *${rider.name}*,\n\nYour payment is *5 days overdue*. This is your final warning.\n\nIf payment is not received today, your case will be moved to our **Recovery Bucket** and an agent will be dispatched to reclaim the vehicle.\n\n🔗 *Pay Now:* ${paymentLink}`;
    }

    const mediaUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLink)}`;
    await sendPaymentReminder(rider.whatsappNumber, { body, mediaUrl });
    
    return true;
  } catch (err) {
    console.error(`❌ Automated Reminder Error [${type}]:`, err.message);
    return false;
  }
};

module.exports = { sendAutomatedPaymentLink };
