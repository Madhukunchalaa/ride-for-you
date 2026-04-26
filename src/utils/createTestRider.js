const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const Rider = require('../models/Rider');

const createTestRider = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const phone = '7095682464';
    const riderName = 'Admin Test (Madhu)';
    
    // Delete existing test rider if any
    await Rider.deleteMany({ whatsappNumber: phone });

    // Create new ridetime k
    const today = new Date();
    const rider = await Rider.create({
      name: riderName,
      whatsappNumber: phone,
      riderStatus: 'active',
      vehicleNumber: 'TS-TEST-01',
      deployDate: today,
      returnDate: today, 
      autoReminderEnabled: true,
      autoReminderTime: '08:20', // NEW SCHEDULED TIME
      paymentStatus: 'unpaid',
      reminderEscalationStage: 0,
      lastAutomatedReminderDate: null
    });

    console.log(`✨ Test Rider Created: ${rider.name}`);
    console.log(`📱 Phone: ${rider.whatsappNumber}`);
    console.log(`⏰ Scheduled Time: ${rider.autoReminderTime}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating test rider:', err);
    process.exit(1);
  }
};

createTestRider();
