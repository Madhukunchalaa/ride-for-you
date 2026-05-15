require('dotenv').config();
const mongoose = require('mongoose');
const Rider = require('./src/models/Rider');

async function resetNextWeek() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to DB');

  const rider = await Rider.findOne({ whatsappNumber: '7095682464' });
  if (!rider) {
    console.log('❌ Test rider not found. Run setup_test_rider.js first.');
    await mongoose.disconnect();
    return;
  }

  // Current IST time + 1 minute
  const now = new Date();
  const istTime = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const ist = new Date(istTime);
  const triggerMin = (ist.getMinutes() + 1) % 60;
  const triggerHr  = triggerMin === 0 ? (ist.getHours() + 1) % 24 : ist.getHours();
  const reminderTime = `${String(triggerHr).padStart(2,'0')}:${String(triggerMin).padStart(2,'0')}`;

  // Simulate next week: returnDate = today again (due today)
  const today = new Date(istTime);
  today.setHours(0, 0, 0, 0);

  rider.returnDate = today;
  rider.paymentStatus = 'unpaid';
  rider.autoReminderTime = reminderTime;
  rider.reminderEscalationStage = 0;           // Reset to Stage 1 for next cycle
  rider.lastAutomatedReminderDate = null;       // Clear so it fires again today
  rider.isRecoveryBucket = false;

  await rider.save();

  console.log(`\n♻️  Next Week Simulated!`);
  console.log(`   📅 Return Date  : ${today.toDateString()} (due again today)`);
  console.log(`   ⏰ IST Reminder : ${reminderTime} (≈ 1 min from now)`);
  console.log(`   🔄 Stage Reset  : Back to Stage 1\n`);
  console.log(`⏳ Watch WhatsApp — next reminder fires at ${reminderTime} IST!\n`);

  await mongoose.disconnect();
}

resetNextWeek().catch(console.error);
