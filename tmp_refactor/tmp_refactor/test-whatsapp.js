require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const test = async () => {
  const testNumber = '7095682464'; // The number from the user's screenshot
  console.log(`🚀 Testing WhatsApp delivery to ${testNumber}...`);
  
  try {
    const result = await sendPaymentReminder(testNumber, { 
      body: "⚡ Test Message from Ride For You. If you see this, your WhatsApp integration is LIVE!" 
    });
    console.log('✅ Twilio Success! SID:', result.sid);
  } catch (err) {
    console.error('❌ Twilio Error Details:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('More Info:', err.moreInfo);
  }
};

test();
