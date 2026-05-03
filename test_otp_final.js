require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testOtpFinal = async () => {
  const testNumber = '7095682464';
  const otpCode = '987654';
  console.log(`🚀 Final OTP Test [otp] to ${testNumber}...`);
  
  try {
    const result = await sendPaymentReminder(testNumber, {
      templateName: 'otp',
      variables: {
        1: otpCode
      },
      buttons: [
        {
          type: 'button',
          sub_type: 'url',
          text: otpCode
        }
      ]
    });
    console.log('✨ OTP Success! Check your phone.');
  } catch (err) {
    console.error('❌ OTP Failed:', err.message);
  }
};

testOtpFinal();
