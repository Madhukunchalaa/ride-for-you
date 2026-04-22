const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const Rider = require('../models/Rider');
const { sendAutomatedPaymentLink } = require('./paymentReminders');

const forceReminder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const phone = '7095682464';
    const rider = await Rider.findOne({ whatsappNumber: phone });

    if (!rider) {
      console.error('❌ Rider not found for phone:', phone);
      process.exit(1);
    }

    console.log(`🚀 Force sending reminder to: ${rider.name}...`);
    
    // Reset escalation stage temporarily for this test if needed
    // But sendAutomatedPaymentLink handles it based on its own logic Usually
    const success = await sendAutomatedPaymentLink(rider, 'normal');

    if (success) {
      console.log('✨ Force Send SUCCESS! Check your WhatsApp.');
    } else {
      console.error('❌ Force Send FAILED! Check server console for errors.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during force send:', err);
    process.exit(1);
  }
};

forceReminder();
