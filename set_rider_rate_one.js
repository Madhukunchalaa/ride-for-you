const mongoose = require('mongoose');
const Rider = require('./src/models/Rider');
require('dotenv').config();

async function setRateToOne() {
  console.log('🏁 [SET-RATE] Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to Database!');

    const targetPhone = '7095682464';
    let rider = await Rider.findOne({ whatsappNumber: targetPhone });

    if (!rider) {
      console.log(`❌ No rider found with whatsappNumber: "${targetPhone}"`);
      return;
    }

    // Set rental rate to exactly 1 (one rupee)
    rider.rentalRate = 1;
    rider.paymentStatus = 'unpaid';
    await rider.save();

    console.log(`\n🎉 SUCCESS! Test Rider record updated:`);
    console.log(`- Name: ${rider.name}`);
    console.log(`- Phone: ${rider.whatsappNumber}`);
    console.log(`- New Rental Rate: ₹${rider.rentalRate} (exactly 1 Rupee!)`);
    console.log(`- Payment Status: "${rider.paymentStatus.toUpperCase()}"`);
    console.log(`\n💡 Now, any payment link generated for this rider on your dashboard will be for exactly ₹1!`);

  } catch (error) {
    console.error('❌ Failed to update rider rate:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🏁 Connection closed.');
  }
}

setRateToOne();
