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
  if (accountSid && authToken && authToken !== 'your_auth_token_here') {
    client = twilio(accountSid, authToken);
  }

  // Ensure number is in correct format (+91 for India)
  let cleaned = to.replace(/[^0-9]/g, '');
  
  // If number starts with 91 and has 12 digits, it already has country code
  // If it has 10 digits, prepend 91
  let formattedNumber = cleaned;
  if (cleaned.length === 10) {
    formattedNumber = '91' + cleaned;
  } else if (cleaned.length > 10 && !cleaned.startsWith('91')) {
    // some other country code or weird format, let it be but warn
    console.warn('⚠️ Non-standard phone number length for India:', cleaned);
  }

  const finalTo = `whatsapp:+${formattedNumber}`;

  if (!client) {
    console.log('📝 [MOCK WHATSAPP] To:', finalTo, 'Options:', options);
    return { sid: 'MOCK_SID_' + Date.now() };
  }

  try {
    const messageConfig = {
      from: from,
      to: finalTo,
    };

    // If body is provided, it's a session message (requires 24h window)
    if (options.body) {
      messageConfig.body = options.body;
      if (options.mediaUrl) {
        messageConfig.mediaUrl = [options.mediaUrl];
      }
    } else {
      // Proactive template message
      messageConfig.contentSid = sid;
      if (options.variables) {
        messageConfig.contentVariables = JSON.stringify(options.variables);
      }
    }

    const message = await client.messages.create(messageConfig);
    console.log('✅ WhatsApp sent:', message.sid);
    return message;
  } catch (err) {
    console.error('❌ WhatsApp Error:', err);
    throw err;
  }
};

module.exports = { sendPaymentReminder };
