require('dotenv').config();
const mongoose = require('mongoose');
const Rider = require('./src/models/Rider');
const razorpay = require('./src/config/razorpay');
const { sendPaymentReminder } = require('./src/utils/whatsapp');

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const testNumber = '7095682464';
    
    // 1. Create/Update test rider
    let rider = await Rider.findOne({ whatsappNumber: testNumber });
    if (!rider) {
      rider = new Rider({
        name: 'Test Admin',
        whatsappNumber: testNumber,
        vehicleNumber: 'TEST-001',
        deployDate: new Date(),
        returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        riderStatus: 'active'
      });
      await rider.save();
    }

    console.log(`👤 Using Rider: ${rider.name}`);

    // 2. Create Razorpay Link (₹1)
    const amountVal = 100; // 100 paise = ₹1
    const uniqueLinkId = `test_${Date.now()}`;

    console.log('📡 Generating Razorpay Link...');
    const response = await razorpay.paymentLink.create({
      amount: amountVal,
      currency: "INR",
      accept_partial: false,
      description: `Test Payment - Ride For You (Rider: ${rider.name})`,
      customer: {
        name: rider.name,
        contact: rider.whatsappNumber,
      },
      notify: { sms: false, email: false },
      notes: { riderId: rider._id.toString() },
      callback_url: `${process.env.FRONTEND_URL}/`,
      callback_method: "get"
    });

    const paymentLink = response.short_url;
    console.log(`✅ Razorpay Link Generated: ${paymentLink}`);

    // 3. Send WhatsApp (Session message since you likely replied "Hi" recently)
    const body = `💳 *LIVE TEST - Ride For You*\n\nHello *${rider.name}*,\n\nThis is a live test of your new **Razorpay Gateway**. \n\n🔗 *Pay ₹1 Now:* ${paymentLink}\n\nIf this works, your bank account is successfully connected! ⚡`;
    
    console.log(`📲 Sending WhatsApp to ${testNumber}...`);
    await sendPaymentReminder(testNumber, { body });
    
    console.log('✨ Test Complete! Check your WhatsApp.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Failed:', err);
    process.exit(1);
  }
}

runTest();
