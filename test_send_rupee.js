const mongoose = require('mongoose');
const phonepe = require('./src/config/phonepe');
const Rider = require('./src/models/Rider');
require('dotenv').config();

async function generateOneRupeePayment() {
  console.log('🏁 [TEST-RUPEE] Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to Database successfully!');

    const targetPhone = '7095682464';
    console.log(`🔍 Searching for rider with whatsappNumber: "${targetPhone}"...`);
    
    let rider = await Rider.findOne({ whatsappNumber: targetPhone });
    
    if (!rider) {
      console.log(`⚠️ No active rider found with phone "${targetPhone}". Creating a temporary test rider...`);
      rider = await Rider.create({
        name: 'Test PhonePe Rider',
        whatsappNumber: targetPhone,
        vehicleNumber: 'TS09TEST001',
        paymentStatus: 'unpaid',
        rentalRate: 2000,
        returnDate: new Date()
      });
      console.log(`✅ Temporary test rider created with ID: ${rider._id}`);
    } else {
      console.log(`✅ Found Rider: "${rider.name}" with ID: ${rider._id}`);
    }

    // Set payment amount to exactly Rs. 1 (100 paise)
    const amountInPaise = 1 * 100;

    console.log(`📡 Requesting Rs. 1 checkout link from PhonePe in [${phonepe.PHONEPE_ENV}] mode...`);
    
    const response = await phonepe.createPaymentLink({
      riderId: rider._id,
      amount: amountInPaise,
      mobileNumber: targetPhone,
      description: `Test Payment Rs. 1 - ${rider.name}`
    });

    // Save transaction ID in database
    rider.paymentLinkId = response.id;
    await rider.save();
    console.log(`💾 Saved payment transaction ID "${response.id}" to Rider's record!`);

    console.log('\n🌟 SUCCESS! CLICK THE LINK BELOW TO MAKE THE 1 RUPEE TEST PAYMENT:');
    console.log('👉', response.url);
    console.log('\nOnce you pay, PhonePe will send the S2S webhook callback, which will extend this rider\'s status automatically!');

  } catch (err) {
    console.error('❌ Failed to process payment request:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n🏁 Connection closed.');
  }
}

generateOneRupeePayment();
