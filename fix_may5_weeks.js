require('dotenv').config();
const mongoose = require('mongoose');
const Rider = require('./src/models/Rider');
const { createInvoiceRecord } = require('./src/utils/invoiceHelper');

const NAMES = [
  'Deepak Bharadwaj', 'Harish odithela', 'Jay kishor kumar',
  'Kaviti durga prasad', 'Mudavath Prasad'
];

// Client manually collected payment on May 5
const PAYMENT_DATE = new Date('2026-05-05');
PAYMENT_DATE.setHours(0, 0, 0, 0);
const NEXT_DUE = new Date('2026-05-12');
NEXT_DUE.setHours(0, 0, 0, 0);

async function fixTotalWeeks() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  for (const name of NAMES) {
    const r = await Rider.findOne({ name: { $regex: new RegExp(name, 'i') } });
    if (!r) { console.log(`❌ Not found: ${name}`); continue; }

    const deploy = new Date(r.deployDate);
    deploy.setHours(0, 0, 0, 0);

    // How many full weeks elapsed from deploy to payment date (May 5)?
    const weeksElapsed = Math.max(1, Math.round((PAYMENT_DATE - deploy) / (1000 * 60 * 60 * 24 * 7)));
    const oldWeeks = r.totalWeeks;

    r.totalWeeks = weeksElapsed;       // all weeks up to May 5 now marked paid
    r.returnDate = NEXT_DUE;           // next due = May 12
    r.paymentStatus = 'unpaid';        // due for next week (May 12)
    r.reminderEscalationStage = 0;
    r.lastAutomatedReminderDate = null;
    r.isRecoveryBucket = false;

    await r.save();

    // Create invoice for the manually collected week (May 5 payment)
    try {
      await createInvoiceRecord(r, r.rentalRate || 2000, 'RENT', 'Manual Cash Payment - 5 May 2026');
    } catch (e) {
      console.log(`   ⚠️ Invoice skipped: ${e.message}`);
    }

    console.log(`✅ ${r.name}`);
    console.log(`   deployDate  : ${deploy.toDateString()}`);
    console.log(`   totalWeeks  : ${oldWeeks} → ${weeksElapsed}`);
    console.log(`   returnDate  : ${NEXT_DUE.toDateString()}\n`);
  }

  console.log('🎉 Done!');
  await mongoose.disconnect();
}

fixTotalWeeks().catch(console.error);
