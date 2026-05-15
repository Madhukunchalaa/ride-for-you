const mongoose = require('mongoose');
require('dotenv').config();
const Rider = require('../src/models/Rider');

async function checkReminders() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://rideforyouev_db_user:58xkKCkO4yiOEXow@cluster0.1taetwt.mongodb.net/ev_rental?retryWrites=true&w=majority&appName=Cluster0";
  
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected.');

    const activeUnpaidRiders = await Rider.find({
      riderStatus: 'active',
      paymentStatus: 'unpaid',
      autoReminderEnabled: true
    });

    console.log(`\nFound ${activeUnpaidRiders.length} active unpaid riders with automated reminders enabled.\n`);

    // We simulate "tomorrow" May 13, 2026
    const tomorrow = new Date('2026-05-13T00:00:00+05:30'); // Asia/Kolkata
    
    console.log(`-----------------------------------------------------------------------------------------------------------`);
    console.log(`SIMULATION FOR TOMORROW (May 13, 2026)`);
    console.log(`-----------------------------------------------------------------------------------------------------------`);
    
    let matchesCount = 0;

    for (const rider of activeUnpaidRiders) {
      const returnDate = new Date(rider.returnDate);
      const todayAtMidnight = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      const returnAtMidnight = new Date(returnDate.getFullYear(), returnDate.getMonth(), returnDate.getDate());
      const daysOverdue = Math.floor((todayAtMidnight - returnAtMidnight) / (1000 * 60 * 60 * 24));

      // Check stage
      let willReceive = false;
      let reason = "";

      if (daysOverdue >= 0 && daysOverdue < 3 && rider.reminderEscalationStage < 1) {
        willReceive = true;
        reason = `Stage 1 (Normal) - Days overdue: ${daysOverdue}`;
      } else if (daysOverdue >= 3 && daysOverdue < 5 && rider.reminderEscalationStage < 2) {
        willReceive = true;
        reason = `Stage 2 (Warning) - Days overdue: ${daysOverdue}`;
      } else if (daysOverdue >= 5 && daysOverdue < 7 && rider.reminderEscalationStage < 3) {
        willReceive = true;
        reason = `Stage 3 (Final) - Days overdue: ${daysOverdue}`;
      } else if (daysOverdue >= 7) {
        // Recovery bucket checks
        const lastSent = rider.lastAutomatedReminderDate ? new Date(rider.lastAutomatedReminderDate) : null;
        let daysSinceLastReminder = 7;
        if (lastSent) {
          const lastSentIST = new Date(lastSent.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
          const lastSentAtMidnight = new Date(lastSentIST.getFullYear(), lastSentIST.getMonth(), lastSentIST.getDate());
          daysSinceLastReminder = Math.floor((todayAtMidnight - lastSentAtMidnight) / (1000 * 60 * 60 * 24));
        }
        if (daysSinceLastReminder >= 7) {
          willReceive = true;
          reason = `Stage 4 (Recovery Continuous Weekly) - Days overdue: ${daysOverdue}`;
        } else {
          reason = `Recovery already sent ${daysSinceLastReminder} days ago (needs 7)`;
        }
      } else {
        reason = `Days overdue is ${daysOverdue}, but escalation stage is already ${rider.reminderEscalationStage}`;
      }

      if (willReceive) {
        matchesCount++;
        console.log(`🚀 [MATCH #${matchesCount}] Name: ${rider.name.padEnd(25)} | WA: +${rider.whatsappNumber.padEnd(13)} | Return: ${returnDate.toLocaleDateString('en-GB')} (${daysOverdue}d overdue) | Time: ${rider.autoReminderTime} | Stage: ${rider.reminderEscalationStage} (${reason})`);
      }
    }

    console.log(`\n===========================================================================================================`);
    console.log(`TOTAL RECIPIENTS TOMORROW (May 13, 2026): ${matchesCount} riders`);
    console.log(`===========================================================================================================`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

checkReminders();
