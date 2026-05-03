require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testDirect = async () => {
  const testNumber = '7095682464';
  console.log('🚀 Testing Way2Chats Rejoiner Direct (1 Var, Fixed Image)...');
  
  try {
    const result = await sendPaymentReminder(testNumber, {
      templateName: 'rejoiner_direct_v1',
      variables: {
        1: 'Madhu (Test)'
      },
      headerImage: 'https://images.unsplash.com/photo-1558981403-c5f91cbba527?w=600'
    });
    console.log('✨ Test Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Test Failed:', err.message);
  }
};

testDirect();
