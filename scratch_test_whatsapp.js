require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testNewTemplate = async () => {
  const testNumber = process.argv[2] || '7095682464';

  
  console.log(`🚀 Sending Test Template Message to: ${testNumber}`);
  
  try {
    const result = await sendPaymentReminder(testNumber, {
      contentSid: process.env.TWILIO_CONTENT_SID,
      variables: {
        "1": "Test User",
        "2": "TEST-1234",
        "3": "26th Oct",
        "4": "https://rideforyouev.com/pay"
      }
    });
    
    console.log('✅ Success! Message SID:', result.sid);
  } catch (err) {
    console.error('❌ Failed to send template message.');
    // Error 63018 means user hasn't messaged you, but templates should bypass this.
    // If it fails with 'Content SID not found', it means the SID in .env is wrong.
  }
};

testNewTemplate();
