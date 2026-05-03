require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testPremiumFlow = async () => {
  const testNumber = '7095682464';
  console.log('🚀 Testing Premium Text + QR Follow-up Flow...');
  
  try {
    const paymentLink = 'https://rzp.io/l/test_premium_flow';
    
    // 1. Send Text Template (3 Vars)
    console.log('Step 1: Sending Text Template...');
    await sendPaymentReminder(testNumber, {
      templateName: 'payment_premium_v1',
      variables: {
        1: 'Madhu',
        2: '800',
        3: paymentLink
      }
    });

    // 2. Send QR Follow-up
    console.log('Step 2: Sending QR Follow-up...');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(paymentLink)}`;
    await sendPaymentReminder(testNumber, {
      templateName: 'rejoiner_direct_v1', // Use the IMAGE-capable template
      variables: { 1: 'SCAN & PAY' },
      headerImage: qrUrl
    });

    console.log('✨ Full Flow Success!');
  } catch (err) {
    console.error('❌ Flow Failed:', err.message);
  }
};

testPremiumFlow();
