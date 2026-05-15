const mongoose = require('mongoose');
const Rider = require('./src/models/Rider');
require('dotenv').config();

async function checkRiderStatus() {
  console.log('🏁 [CHECK-RIDER] Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to Database!');

    const targetPhone = '7095682464';
    const rider = await Rider.findOne({ whatsappNumber: targetPhone });

    if (!rider) {
      console.log(`❌ No rider found with whatsappNumber: "${targetPhone}"`);
      return;
    }

    console.log('\n📊 CURRENT RIDER STATUS IN DATABASE:');
    console.log(`-----------------------------------------------`);
    console.log(`- ID: ${rider._id}`);
    console.log(`- Name: ${rider.name}`);
    console.log(`- Phone: ${rider.whatsappNumber}`);
    console.log(`- Vehicle Number: ${rider.vehicleNumber}`);
    console.log(`- Rental Status: ${rider.riderStatus}`);
    console.log(`- Return Date: ${rider.returnDate}`);
    console.log(`- Payment Status: "${rider.paymentStatus.toUpperCase()}"`);
    console.log(`- Registered Payment Link ID: ${rider.paymentLinkId || 'NONE'}`);
    console.log(`- Short Link Url: https://rideforyouev.com/api/payments/pay/${rider._id}`);
    
    if (rider.lastWebhookData) {
      console.log('\n📡 Webhook Payload received on this rider:');
      console.log(JSON.stringify(rider.lastWebhookData, null, 2));
    } else {
      console.log('\n📡 No Webhook callbacks have updated this rider yet.');
    }
    console.log(`-----------------------------------------------`);

  } catch (error) {
    console.error('❌ Failed to check rider status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🏁 Connection closed.');
  }
}

checkRiderStatus();
