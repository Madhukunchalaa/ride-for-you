const twilio = require('twilio');
const { metaApi } = require('../config/meta');
const { way2chatsApi, way2chatsConfig } = require('../config/way2chats');

/**
 * Sends a WhatsApp message using Way2Chats (default), Meta, or Twilio.
 */
const sendPaymentReminder = async (to, options = {}) => {
  const provider = process.env.WHATSAPP_PROVIDER || 'way2chats';
  
  let cleaned = to.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) cleaned = '91' + cleaned;

  if (provider === 'way2chats') {
    return sendViaWay2Chats(cleaned, options);
  } else if (provider === 'meta') {
    return sendViaMeta(cleaned, options);
  } else {
    return sendViaTwilio(cleaned, options);
  }
};

/**
 * Way2Chats API Sender
 */
const sendViaWay2Chats = async (to, options) => {
  try {
    const { templateName, variables } = options;
    
    // Way2Chats uses a flat array for bodyParams
    const bodyParams = variables ? Object.keys(variables)
      .sort((a, b) => Number(a) - Number(b))
      .map(key => String(variables[key])) : [];

    const payload = {
      to: to,
      phoneNoId: way2chatsConfig.phoneId,
      type: 'template',
      name: templateName || 'payment_reminder_v1',
      language: options.language || 'en',
      bodyParams: bodyParams,
      ...(options.buttons && { buttons: options.buttons }),
      ...(options.headerImage && { 
        headerParams: [
          {
            type: 'image',
            url: options.headerImage
          }
        ]
      })
    };

    console.log(`📲 Sending Way2Chats Template [${payload.name}] to ${to}...`);
    const response = await way2chatsApi.post('', payload);
    console.log('✅ Way2Chats WhatsApp sent:', response.data.id || 'SUCCESS');
    return response.data;
  } catch (err) {
    console.error('❌ Way2Chats WhatsApp Error:', err.response?.data || err.message);
    throw err;
  }
};

/**
 * Twilio Sender (Legacy/Fallback)
 */
const sendViaTwilio = async (to, options) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const sid = options.contentSid || process.env.TWILIO_CONTENT_SID;

  if (!accountSid || !authToken || authToken.includes('your_')) {
    console.log('📝 [MOCK TWILIO] To:', to, 'Options:', options);
    return { sid: 'MOCK_SID_' + Date.now() };
  }

  const client = twilio(accountSid, authToken);
  const finalTo = `whatsapp:+${to}`;

  try {
    const messageConfig = { from, to: finalTo };

    if (sid && !options.body) {
      messageConfig.contentSid = sid;
      if (options.variables) {
        messageConfig.contentVariables = JSON.stringify(options.variables);
      }
    } else {
      messageConfig.body = options.body;
    }

    const message = await client.messages.create(messageConfig);
    console.log('✅ Twilio WhatsApp sent:', message.sid);
    return message;
  } catch (err) {
    console.error('❌ Twilio WhatsApp Error:', err.message);
    throw err;
  }
};

const sendReengageMessage = async (to, name, link = 'https://rideforyouev.com') => {
  return sendPaymentReminder(to, {
    templateName: 'rejoiner_direct_v1',
    variables: { 1: name },
    headerImage: 'https://rideforyouev.com/assets/fusion.png'
  });
};

module.exports = { sendPaymentReminder, sendReengageMessage };

