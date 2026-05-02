const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testWay2Chats = async () => {
  const testNumber = '7095682464'; // Your number
  
  console.log('🚀 Testing Way2Chats API Integration...');
  console.log('Using Number:', testNumber);
  console.log('Provider:', process.env.WHATSAPP_PROVIDER || 'way2chats');

  try {
    const result = await sendPaymentReminder(testNumber, {
      templateName: 'payment_reminder_v1', 
      variables: {
        1: 'Madhu',
        2: 'AP01-1234',
        3: '05 May',
        4: 'https://rideforyouev.com/pay/test_link'
      }
    });
    console.log('✨ Test Result:', JSON.stringify(result, null, 2));
    console.log('\n✅ If you see SUCCESS above and received a message, Way2Chats is working!');
  } catch (err) {
    console.error('\n❌ Test Failed!');
    if (err.response) {
      console.error('Error Details:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error Message:', err.message);
    }
  }
};

testWay2Chats();
