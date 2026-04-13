const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM;
const contentSid = process.env.TWILIO_CONTENT_SID;

let client;
if (accountSid && authToken && authToken !== 'your_auth_token_here') {
  client = twilio(accountSid, authToken);
}

/**
 * Sends a WhatsApp message using a Twilio Content Template.
 * @param {string} to - Recipient WhatsApp number (e.g., 'whatsapp:+91...')
 * @param {Object} variables - Variables for the template (JSON string)
 */
const sendPaymentReminder = async (to, variables) => {
  if (!client) {
    console.log('📝 [MOCK WHATSAPP] To:', to, 'Variables:', variables);
    return { sid: 'MOCK_SID_' + Date.now() };
  }

  try {
    const message = await client.messages.create({
      from: from,
      to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
      contentSid: contentSid,
      contentVariables: JSON.stringify(variables)
    });
    console.log('✅ WhatsApp sent:', message.sid);
    return message;
  } catch (err) {
    console.error('❌ WhatsApp Error:', err);
    throw err;
  }
};

module.exports = { sendPaymentReminder };
