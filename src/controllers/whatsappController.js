const twilio = require('twilio');

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
