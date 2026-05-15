const mongoose = require('mongoose');
const phonepe = require('./src/config/phonepe');
const Rider = require('./src/models/Rider');
const { sendPaymentReminder } = require('./src/utils/whatsapp');
require('dotenv').config();

async function sendWhatsAppPayment() {
  console.log('🏁 [WHATSAPP-RUPEE] Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to Database!');

    const targetPhone = '7095682464';
    let rider = await Rider.findOne({ whatsappNumber: targetPhone });
    
    if (!rider) {
      console.log('⚠️ Test rider not found in DB. Creating one...');
      rider = await Rider.create({
        name: 'Test PhonePe Rider',
        whatsappNumber: targetPhone,
        vehicleNumber: 'TS09TEST001',
        paymentStatus: 'unpaid',
        rentalRate: 2000,
        returnDate: new Date()
      });
    }

    // Amount = Rs. 10 (1000 paise)
    const amountInPaise = 1000;
    
    console.log('📡 Requesting a fresh Rs. 10 Live Payment Link from PhonePe V2...');
    const response = await phonepe.createPaymentLink({
      riderId: rider._id,
      amount: amountInPaise,
      mobileNumber: targetPhone,
      description: `Test Payment Rs. 1 - ${rider.name}`
    });

    const paymentLink = `https://rideforyouev.com/api/payments/pay/${rider._id}`;
    
    // Save transaction ID and URL in database
    rider.paymentLinkId = response.id;
    rider.paymentLinkUrl = response.url;
    await rider.save();
    console.log(`💾 Saved transaction ID "${response.id}" to database!`);

    // Today's Date formatted
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    // Way2Chats template payment_reminder_v1 variables:
    // 1: Name, 2: Vehicle No, 3: Date, 4: Payment Link
    console.log(`📡 Sending Meta-Compliant WhatsApp Template to ${targetPhone}...`);
    await sendPaymentReminder(targetPhone, {
      templateName: 'payment_reminder_v1',
      variables: {
        1: rider.name,
        2: rider.vehicleNumber,
        3: formattedDate,
        4: paymentLink
      }
    });
    
    console.log('\n🌟 SUCCESS! WHATSAPP MESSAGE SENT SUCCESSFULLY!');
    console.log(`Checkout URL: ${paymentLink}`);

  } catch (error) {
    console.error('❌ Failed to generate or send WhatsApp payment link:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🏁 Connection closed.');
  }
}

sendWhatsAppPayment();
