require('dotenv').config();
const { sendPaymentReminder } = require('./whatsapp');

const testWhatsApp = async () => {
  // Use the number provided or a default for testing
  const testNumber = process.argv[2] || '7095682464'; 
  
  console.log(`🚀 Starting WhatsApp Test to: ${testNumber}`);
  console.log(`📡 From: ${process.env.TWILIO_WHATSAPP_FROM}`);

  try {
    // 1. Try a simple session message (only works if user messaged you in 24h)
    console.log('--- Attempting Session Message ---');
    const msg1 = await sendPaymentReminder(testNumber, { 
      body: 'Hello! This is a test from your new Twilio Premium WhatsApp account. ⚡' 
    });
    console.log('✅ Session Message Sent. SID:', msg1.sid);

    // 2. Try a template message (Works for "everyone" - requires approved template)
    // Note: If your Content SID is not approved yet, this might fail.
    if (process.env.TWILIO_CONTENT_SID && process.env.TWILIO_CONTENT_SID !== 'HX...') {
        console.log('\n--- Attempting Template Message ---');
        const msg2 = await sendPaymentReminder(testNumber, {
          contentSid: process.env.TWILIO_CONTENT_SID,
          variables: { "1": "Test User" } // Adjust variables based on your template
        });
        console.log('✅ Template Message Sent. SID:', msg2.sid);
    }

  } catch (err) {
    console.error('\n❌ Test Failed:');
    if (err.code === 63018) {
      console.error('Error 63018: Free-form messages are only allowed within 24h of a user message. You MUST use a template for proactive messaging.');
    } else if (err.code === 20003) {
      console.error('Error 20003: Invalid Account SID or Auth Token. Please check your .env');
    } else {
      console.error(err);
    }
  }
};

testWhatsApp();
