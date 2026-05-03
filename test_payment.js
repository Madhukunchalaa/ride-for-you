require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testPayment = async () => {
  const testNumber = '7095682464';
  console.log('🚀 Testing Way2Chats Payment Reminder (4 Vars)...');
  
  try {
    const result = await sendPaymentReminder(testNumber, {
      templateName: 'payment_reminder_v1',
      variables: {
        1: 'Madhu',
        2: 'TS07 EX 1234',
        3: '05 May',
        4: 'https://rzp.io/l/test'
      }
    });
    console.log('✨ Test Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Test Failed:', err.message);
  }
};

testPayment();
