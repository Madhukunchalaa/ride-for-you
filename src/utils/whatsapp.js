const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM;
const contentSid = process.env.TWILIO_CONTENT_SID;

/**
 * Sends a WhatsApp message (Template or Session based).
 * @param {string} to - Recipient WhatsApp number.
 * @param {Object} options - { body, variables, mediaUrl, contentSid }
 */
const sendPaymentReminder = async (to, options = {}) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  
  // Use provided contentSid or fallback to env
  const sid = options.contentSid || process.env.TWILIO_CONTENT_SID;

  let client;
  if (accountSid && authToken && !authToken.includes('your_')) {
    client = twilio(accountSid, authToken);
  }

  // Ensure number is in correct format (+91 for India)
  let cleaned = to.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  const finalTo = `whatsapp:+${cleaned}`;

  if (!client) {
    console.log('📝 [MOCK WHATSAPP] To:', finalTo, 'Options:', options);
    return { sid: 'MOCK_SID_' + Date.now() };
  }

  try {
    const messageConfig = {
      from: from,
      to: finalTo,
    };

    // If contentSid (Template) is present, use it (Business standard)
    if (sid && !options.body) {
      console.log(`📋 Sending Template Message [SID: ${sid}] to ${finalTo}`);
      messageConfig.contentSid = sid;
      if (options.variables) {
        // Twilio expects a JSON string or object for variables
        messageConfig.contentVariables = JSON.stringify(options.variables);
      }
    } else {
      // Session message (Free-form)
      console.log(`💬 Sending Session Message to ${finalTo}`);
      messageConfig.body = options.body;
      if (options.mediaUrl) {
        messageConfig.mediaUrl = [options.mediaUrl];
      }
    }

    const message = await client.messages.create(messageConfig);
    console.log('✅ WhatsApp sent:', message.sid);
    return message;
  } catch (err) {
    console.error('❌ WhatsApp Error Details:', {
      code: err.code,
      message: err.message,
      moreInfo: err.moreInfo
    });
    throw err;
  }
};


module.exports = { sendPaymentReminder };
