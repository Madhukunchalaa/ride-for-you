require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testOTP = async () => {
  const testNumber = '7095682464';
  console.log('🚀 Testing Way2Chats OTP (Text Only)...');
  
  try {
    const result = await sendPaymentReminder(testNumber, {
      templateName: 'otp',
      variables: {
        1: '123456'
      }
    });
    console.log('✨ Test Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Test Failed:', err.message);
  }
};

testOTP();
