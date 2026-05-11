require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testRejoiner = async () => {
  const testNumber = '7095682464';
  
  console.log('🚀 Testing Way2Chats Rejoinder Promo (Image + Text) with name promo...');
  
  try {
    const result = await sendPaymentReminder(testNumber, {
      templateName: 'promo',
      variables: {
        1: 'Madhu (Test)'
      },
      headerImage: 'https://rideforyouev.com/assets/promo_flyer.jpg'
    });
    
    console.log('✨ Test Result:', JSON.stringify(result, null, 2));
    console.log('\n✅ If you received the BIKE IMAGE and the welcome back text, it is working perfectly!');
  } catch (err) {
    console.error('❌ Test Failed:', err.message);
  }
};

testRejoiner();
