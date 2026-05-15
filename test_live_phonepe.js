const mongoose = require('mongoose');
const phonepe = require('./src/config/phonepe');
require('dotenv').config();

async function runTest() {
  console.log('🏁 [TEST-PHONEPE] Starting PhonePe Payment Gateway Integration Test...');
  
  // 1. Diagnostics & Key Verification
  console.log('\n🔍 [1/3] Verifying Environment Configurations:');
  console.log(`- PHONEPE_ENV: ${process.env.PHONEPE_ENV || 'production (default)'}`);
  console.log(`- Base Endpoint: ${phonepe.BASE_URL}`);
  
  const mask = (val) => val ? `${val.substring(0, 4)}...${val.substring(val.length - 4)}` : 'MISSING';
  console.log(`- Merchant ID: ${mask(process.env.PHONEPE_MERCHANT_ID || phonepe.MERCHANT_ID)}`);
  console.log(`- Salt Key: ${mask(process.env.PHONEPE_SALT_KEY || phonepe.SALT_KEY)}`);
  console.log(`- Salt Index: ${process.env.PHONEPE_SALT_INDEX || phonepe.SALT_INDEX}`);

  if (!process.env.PHONEPE_MERCHANT_ID || !process.env.PHONEPE_SALT_KEY) {
    console.log('\n⚠️ [NOTE] Custom .env keys not detected or fully populated. Using default PhonePe UAT/Sandbox credentials.');
  }

  // 2. Generate Live payment checkout link
  console.log('\n🚀 [2/3] Testing Payment Page Link Generation (/pg/v1/pay):');
  const testRiderId = new mongoose.Types.ObjectId(); // Mock MongoDB ObjectId
  const testAmount = 2000 * 100; // Rs. 2000 in paise
  const testMobile = '919876543210';
  const testDesc = 'Weekly EV Rental Test Invoice';

  try {
    const response = await phonepe.createPaymentLink({
      riderId: testRiderId,
      amount: testAmount,
      mobileNumber: testMobile,
      description: testDesc
    });

    console.log('\n🎉 SUCCESS! PHONEPE PAY LINK GENERATED SUCCESSFULLY!');
    console.log(`- Generated Transaction ID: ${response.id}`);
    console.log(`- Checkout Redirect URL:`);
    console.log(`  👉 ${response.url}`);

    // 3. Status check testing
    console.log('\n📡 [3/3] Testing Transaction Status Check API (/pg/v1/status):');
    const statusResponse = await phonepe.checkPaymentStatus(response.id);
    
    if (statusResponse.success) {
      console.log('✅ Status API successfully responded!');
      console.log(`- Payment State: ${statusResponse.paymentState}`);
      console.log(`- Code: ${statusResponse.code}`);
      console.log(`- Amount Checked: ₹${statusResponse.amount}`);
    } else {
      console.warn('⚠️ Status API responded but query returned false:', statusResponse.message);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED: PhonePe integration raised an error:');
    console.error(error.message);
  }

  console.log('\n🏁 [TEST-PHONEPE] Test execution completed.');
}

runTest();
