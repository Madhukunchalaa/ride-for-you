require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const sendToUser = async () => {
  const userNumber = '7095682464';
  console.log('🚀 Sending Test Promo to User (7989776255)...');
  
  try {
    const result = await sendPaymentReminder(userNumber, {
      templateName: 'rejoiner_direct_v1',
      variables: {
        1: 'Madhu'
      }
    });
    console.log('✨ Success! Response:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
};

sendToUser();
