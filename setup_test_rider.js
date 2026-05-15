require('dotenv').config();
const mongoose = require('mongoose');
const Rider = require('./src/models/Rider');

async function setupTestRider() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to DB');

  // Current IST time + 1 minute
  const now = new Date();
  const istTime = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const ist = new Date(istTime);
  const triggerMin = (ist.getMinutes() + 1) % 60;
  const triggerHr  = triggerMin === 0 ? (ist.getHours() + 1) % 24 : ist.getHours();
  const reminderTime = `${String(triggerHr).padStart(2,'0')}:${String(triggerMin).padStart(2,'0')}`;

  // returnDate = today (due today = Stage 1)
  const today = new Date(istTime);
  today.setHours(0, 0, 0, 0);

  // deployDate = 7 days ago
  const deployDate = new Date(today);
  deployDate.setDate(deployDate.getDate() - 7);

  // Delete if exists
  await Rider.deleteOne({ whatsappNumber: '7095682464' });
  console.log('🗑️  Cleared old test rider if any.');

  const rider = new Rider({
    name: 'Madhu Test',
    whatsappNumber: '7095682464',
    vehicleNumber: 'TEST01',
    riderStatus: 'active',
    paymentStatus: 'unpaid',
    rentalRate: 1,
    deployDate: deployDate,
    returnDate: today,        // Due today → Stage 1 fires
    totalWeeks: 1,
    autoReminderEnabled: true,
    autoReminderTime: reminderTime,
    reminderEscalationStage: 0,
    lastAutomatedReminderDate: null,
    bikesUsed: ['TEST01']
  });

  await rider.save();

  console.log(`\n✅ Fresh Test Rider Created!`);
  console.log(`   📱 Number     : 7095682464`);
  console.log(`   💰 Rate       : ₹1`);
  console.log(`   📅 Return Date: ${today.toDateString()} (due today → Stage 1)`);
  console.log(`   ⏰ IST Reminder: ${reminderTime} (≈ 1 min from now)`);
  console.log(`\n⏳ Watch WhatsApp — Stage 1 reminder fires at ${reminderTime} IST!`);
  console.log(`\n👉 After paying, run:  node reset_next_week.js`);
  console.log(`   This will simulate next week's due date and set reminder to +1 min again.\n`);

  await mongoose.disconnect();
}

setupTestRider().catch(console.error);
