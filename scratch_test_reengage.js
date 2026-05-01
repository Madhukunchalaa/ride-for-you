require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testReengageTemplate = async () => {
  const testNumber = '7095682464';
  const sid = process.env.TWILIO_REENGAGE_CONTENT_SID;

  console.log(`🚀 Sending Re-engage Test Template [SID: ${sid}] to: ${testNumber}`);
  
  try {
    const result = await sendPaymentReminder(testNumber, {
      contentSid: sid,
      variables: {
        "1": "Test User"
      }
    });
    
    console.log('✅ Success! Message SID:', result.sid);
  } catch (err) {
    console.error('❌ Failed to send re-engage template message.');
    console.error(err.message);
  }
};

testReengageTemplate();
