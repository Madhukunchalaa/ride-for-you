require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testPremium = async () => {
  const testNumber = '7095682464';
  console.log('🚀 Testing Premium QR Payment (3 Vars + QR Header)...');
  
  try {
    const paymentLink = 'https://rzp.io/l/test_premium';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(paymentLink)}&color=000000&bgcolor=ffffff&qzone=2`;

    const result = await sendPaymentReminder(testNumber, {
      templateName: 'payment_premium_v1', // Using the new name
      variables: {
        1: 'Madhu',
        2: '800',
        3: paymentLink
      },
      headerImage: qrUrl
    });
    console.log('✨ Success! Response:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
};

testPremium();
