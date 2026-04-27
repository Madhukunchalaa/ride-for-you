const twilio = require('twilio');
const Rider = require('../models/Rider');
const { sendReengageMessage } = require('../utils/whatsapp');


/**
 * Handles incoming WhatsApp messages from Twilio Webhook
 */
exports.handleIncoming = async (req, res) => {
  const { Body, From } = req.body;
  
  console.log(`📩 Incoming WhatsApp from ${From}: ${Body}`);

  try {
    const twiml = new twilio.twiml.MessagingResponse();
    
    const message = Body.toLowerCase();

    if (message.includes('paid') || message.includes('done')) {
      twiml.message('Thank you for the update! ⚡ Our team will verify the payment and update your status shortly.');
    } else if (message.includes('help') || message.includes('support')) {
      twiml.message('Need help? 🛠️ You can contact our support team at +91 7989776255 or visit our office.');
    } else {
      twiml.message('Hello! 👋 This is an automated response from Ride For You. If you have questions about your rental, please contact support or reply with "HELP".');
    }

    res.type('text/xml').send(twiml.toString());
  } catch (err) {
    console.error('❌ Webhook Error:', err);
    res.status(500).send('Error processing message');
  }
};

/**
 * Sends re-engagement messages to all past (inactive) riders
 */
exports.sendBulkReengage = async (req, res) => {
  try {
    const pastRiders = await Rider.find({ riderStatus: 'inactive' });
    
    if (pastRiders.length === 0) {
      return res.status(200).json({ success: true, message: 'No past riders found to re-engage.' });
    }

    console.log(`🚀 Bulk Re-engage: Sending to ${pastRiders.length} riders...`);

    const results = [];
    for (const rider of pastRiders) {
      try {
        await sendReengageMessage(rider.whatsappNumber, rider.name);
        results.push({ id: rider._id, status: 'success' });
      } catch (err) {
        console.error(`❌ Failed to send to ${rider.name}:`, err.message);
        results.push({ id: rider._id, status: 'failed', error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      count: results.length,
      successCount: results.filter(r => r.status === 'success').length,
      details: results
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
