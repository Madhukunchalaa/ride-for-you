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
    console.log('🤖 Running Automated Reminders & Recovery check...');
    
    try {
      const today = new Date();
      // Get current hours and minutes in HH:mm format
      const currentHour = today.getHours().toString().padStart(2, '0');
      const currentMinute = today.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      
      const riders = await Rider.find({ 
        riderStatus: 'active', 
        paymentStatus: 'unpaid',
        autoReminderEnabled: true
      });

      for (const rider of riders) {
        console.log(`🔍 Checking Rider: ${rider.name} (${rider.whatsappNumber})`);
        
        const returnDate = new Date(rider.returnDate);
        const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const returnAtMidnight = new Date(returnDate.getFullYear(), returnDate.getMonth(), returnDate.getDate());
        const daysOverdue = Math.floor((todayAtMidnight - returnAtMidnight) / (1000 * 60 * 60 * 24));
        
        console.log(`   - Scheduled Time: ${rider.autoReminderTime} | Current Time: ${currentTime}`);
        console.log(`   - Days Overdue: ${daysOverdue} | Escalation Stage: ${rider.reminderEscalationStage}`);

        const lastSentDate = rider.lastAutomatedReminderDate ? new Date(rider.lastAutomatedReminderDate).toDateString() : null;
        if (lastSentDate === today.toDateString()) {
          console.log(`   - ⏭️ Skipping: Already sent a reminder today.`);
          continue;
        }

        // Logic check: Match time OR be overdue
        // We allow a 5-minute window in case the cron starts a few seconds/minutes late
        const [targetH, targetM] = rider.autoReminderTime.split(':').map(Number);
        const [currH, currM] = [today.getHours(), today.getMinutes()];
        
        const isExactTime = (currH === targetH && currM >= targetM && currM < targetM + 5);
        const isOverdueTrigger = (daysOverdue > 0);

        if (!isExactTime && !isOverdueTrigger) {
          console.log(`   - ⏭️ Skipping: Not the scheduled time yet and not overdue.`);
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
        else if (daysOverdue >= 7 && !rider.isRecoveryBucket) {
          rider.isRecoveryBucket = true;
          console.log(`⚠️ Moving rider ${rider.name} to RECOVERY BUCKET (Overdue: ${daysOverdue} days)`);
        }

        if (rider.isModified()) {
          await rider.save();
        }
      }
    } catch (err) {
      console.error('❌ Error in Automated Reminders Job:', err.message);
    }
  });

  console.log('🚀 Automated Reminder Service Initialized (Hourly Check)');
};

module.exports = { initAutomatedReminders };
