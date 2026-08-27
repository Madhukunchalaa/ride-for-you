const cron = require('node-cron');
const Rider = require('../models/Rider');
const { sendAutomatedPaymentLink } = require('../utils/paymentReminders');

/**
 * Service to handle automated payment reminders and recovery bucket logic.
 * Checks every hour for riders due for reminders.
 */
const initAutomatedReminders = () => {
  // Run every minute for high precision
  cron.schedule('* * * * *', async () => {

    // ⏸️ PAUSE SWITCH — set PAUSE_AUTO_REMINDERS=true in .env to stop all automated reminders
    if (process.env.PAUSE_AUTO_REMINDERS === 'true') {
      console.log('⏸️ [AUTO REMINDERS PAUSED] Skipping — set PAUSE_AUTO_REMINDERS=false to resume.');
      return;
    }

    console.log(`🤖 [${new Date().toISOString()}] Running Automated Reminders check...`);
    
    try {
      // FORCE IST TIMEZONE
      const now = new Date();
      const istTime = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const today = new Date(istTime);
      
      const currentHour = today.getHours().toString().padStart(2, '0');
      const currentMinute = today.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      
      console.log(`📡 Server Time (IST): ${currentTime}`);

      const riders = await Rider.find({ 
        riderStatus: 'active', 
        paymentStatus: 'unpaid',
        autoReminderEnabled: true,
        isPoliceRecovery: { $ne: true }
      });

      for (const rider of riders) {
        console.log(`🔍 Checking Rider: ${rider.name} (${rider.whatsappNumber})`);
        
        const returnDateISTStr = new Date(rider.returnDate).toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const returnDateIST = new Date(returnDateISTStr);

        const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const returnAtMidnight = new Date(returnDateIST.getFullYear(), returnDateIST.getMonth(), returnDateIST.getDate());
        const daysOverdue = Math.floor((todayAtMidnight - returnAtMidnight) / (1000 * 60 * 60 * 24));
        
        console.log(`   - Scheduled: ${rider.autoReminderTime} | Days Overdue: ${daysOverdue}`);

        let lastSentDateStr = null;
        if (rider.lastAutomatedReminderDate) {
          const lastSentIST = new Date(rider.lastAutomatedReminderDate).toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
          lastSentDateStr = new Date(lastSentIST).toDateString();
        }

        if (lastSentDateStr === today.toDateString()) {
          console.log(`   - ⏭️ Already reminded today.`);
          continue;
        }

        // 5-Minute Window Matching (all reminders only fire at their scheduled hour, e.g. 12:00 PM)
        const [targetH, targetM] = rider.autoReminderTime.split(':').map(Number);
        const [currH, currM] = [today.getHours(), today.getMinutes()];
        const isTimeMatch = (currH === targetH && currM >= targetM && currM < targetM + 5);

        if (!isTimeMatch) {
          continue;
        }

        console.log(`   - 🚀 Triggering reminder logic for stage ${rider.reminderEscalationStage}...`);
        let success = false;

        // Stage 1: Normal (Due Today or Yesterday)
        if (daysOverdue >= 0 && daysOverdue < 3 && rider.reminderEscalationStage < 1) {
          console.log(`   - 📤 Sending Stage 1 (NORMAL) reminder...`);
          success = await sendAutomatedPaymentLink(rider, 'normal');
          if (success) {
            rider.reminderEscalationStage = 1;
            rider.lastAutomatedReminderDate = today;
          }
        } 
        // Stage 2: Warning (3-4 days overdue)
        else if (daysOverdue >= 3 && daysOverdue < 5 && rider.reminderEscalationStage < 2) {
          console.log(`   - 📤 Sending Stage 2 (WARNING) reminder...`);
          success = await sendAutomatedPaymentLink(rider, 'warning');
          if (success) {
            rider.reminderEscalationStage = 2;
            rider.lastAutomatedReminderDate = today;
          }
        }
        // Stage 3: Final (5-6 days overdue)
        else if (daysOverdue >= 5 && daysOverdue < 7 && rider.reminderEscalationStage < 3) {
          console.log(`   - 📤 Sending Stage 3 (FINAL) reminder...`);
          success = await sendAutomatedPaymentLink(rider, 'final');
          if (success) {
            rider.reminderEscalationStage = 3;
            rider.lastAutomatedReminderDate = today;
          }
        }
        // Stage 4: Recovery Bucket (7+ days overdue)
        else if (daysOverdue >= 7) {
          if (!rider.isRecoveryBucket) {
            rider.isRecoveryBucket = true;
            console.log(`⚠️ Moving rider ${rider.name} to RECOVERY BUCKET (Overdue: ${daysOverdue} days)`);
          }

          // Send reminder once every 7 days (weekly) while they remain active and unpaid
          const lastSent = rider.lastAutomatedReminderDate ? new Date(rider.lastAutomatedReminderDate) : null;
          let daysSinceLastReminder = 7;

          if (lastSent) {
            const lastSentIST = new Date(lastSent.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            const lastSentAtMidnight = new Date(lastSentIST.getFullYear(), lastSentIST.getMonth(), lastSentIST.getDate());
            daysSinceLastReminder = Math.floor((todayAtMidnight - lastSentAtMidnight) / (1000 * 60 * 60 * 24));
          }

          if (daysSinceLastReminder >= 7) {
            console.log(`   - 📤 [RECOVERY] Overdue by ${daysOverdue} days. Sending continuous weekly reminder...`);
            success = await sendAutomatedPaymentLink(rider, 'final');
            if (success) {
              rider.lastAutomatedReminderDate = today;
            }
          }
        }

        if (rider.isModified()) {
          await rider.save();
        }
      }
    } catch (err) {
      console.error('❌ Error in Automated Reminders Job:', err.message);
    }
  });

  console.log('🚀 Automated Reminder Service Initialized (Real-time Check)');
};

module.exports = { initAutomatedReminders };
