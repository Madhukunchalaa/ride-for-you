const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testMeta = async () => {
  const testNumber = '7095682464'; // Using your number for the test
  
  console.log('🚀 Testing Meta Cloud API Integration...');
  console.log('Using Number:', testNumber);
  console.log('Provider:', process.env.WHATSAPP_PROVIDER);

  try {
    const result = await sendPaymentReminder(testNumber, {
      templateName: 'hello_world', // Default Meta test template
      variables: {
        1: 'Madhu'
      }
    });
    console.log('✨ Test Result:', JSON.stringify(result, null, 2));
    console.log('\n✅ If you see an ID above and received a message, Meta is working!');
  } catch (err) {
    console.error('\n❌ Test Failed!');
    if (err.response) {
      console.error('Error Details:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error Message:', err.message);
    }
  }
};

testMeta();
