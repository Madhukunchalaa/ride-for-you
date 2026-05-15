require('dotenv').config();
const mongoose = require('mongoose');
const Rider = require('./src/models/Rider');

const RIDERS_TO_FIX = [
  'Deepak Bharadwaj',
  'Harish odithela',
  'Jay kishor kumar',
  'Kaviti durga prasad',
  'Mudavath Prasad'
];

// Paid on 5th May → next due = 12th May 2026
const PAYMENT_DATE = new Date('2026-05-05');
PAYMENT_DATE.setHours(0, 0, 0, 0);
const NEXT_DUE = new Date(PAYMENT_DATE);
NEXT_DUE.setDate(NEXT_DUE.getDate() + 7); // May 12

async function fixRiders() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to DB\n');

  for (const name of RIDERS_TO_FIX) {
    // Case-insensitive name search
    const rider = await Rider.findOne({ name: { $regex: new RegExp(name, 'i') } });
    if (!rider) {
      console.log(`❌ Not found: ${name}`);
      continue;
    }

    const oldReturn = rider.returnDate ? new Date(rider.returnDate).toDateString() : 'N/A';
    rider.returnDate = NEXT_DUE;
    rider.paymentStatus = 'unpaid'; // They are due now (May 12 = today)
    rider.reminderEscalationStage = 0;
    rider.lastAutomatedReminderDate = null;
    rider.isRecoveryBucket = false;
    await rider.save();

    console.log(`✅ Fixed: ${rider.name}`);
    console.log(`   Old returnDate: ${oldReturn}`);
    console.log(`   New returnDate: ${NEXT_DUE.toDateString()} (paid 5-May → due 12-May)\n`);
  }

  console.log('🎉 All done!');
  await mongoose.disconnect();
}

fixRiders().catch(console.error);
