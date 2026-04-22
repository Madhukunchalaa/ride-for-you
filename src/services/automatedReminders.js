const cron = require('node-cron');
const Rider = require('../models/Rider');
const { sendAutomatedPaymentLink } = require('../utils/paymentReminders');

/**
 * Service to handle automated payment reminders and recovery bucket logic.
 * Checks every hour for riders due for reminders.
 */
const initAutomatedReminders = () => {
  // Run every hour at the top of the hour
  cron.schedule('0 * * * *', async () => {
    console.log('🤖 Running Automated Reminders & Recovery check...');
    
    try {
      const today = new Date();
      const currentHourMinute = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
      
      const riders = await Rider.find({ 
        riderStatus: 'active', 
        paymentStatus: 'unpaid',
        autoReminderEnabled: true
      });

      for (const rider of riders) {
        const returnDate = new Date(rider.returnDate);
        const daysOverdue = Math.floor((today - returnDate) / (1000 * 60 * 60 * 24));
        const lastSentDate = rider.lastAutomatedReminderDate ? new Date(rider.lastAutomatedReminderDate).toDateString() : null;
        
        // Prevent sending multiple reminders on the same day
        if (lastSentDate === today.toDateString()) continue;

        // Only send at the rider's specified time (or if they are already overdue)
        // We allow a 1-hour window for the "exact time" check since the cron runs hourly
        const riderTimeHour = rider.autoReminderTime.split(':')[0];
        const currentHour = today.getHours().toString().padStart(2, '0');

        if (currentHour !== riderTimeHour && daysOverdue <= 0) continue;

        let success = false;

        // Stage 1: Normal (Due Today or Yesterday)
        if (daysOverdue >= 0 && daysOverdue < 3 && rider.reminderEscalationStage < 1) {
          success = await sendAutomatedPaymentLink(rider, 'normal');
          if (success) {
            rider.reminderEscalationStage = 1;
            rider.lastAutomatedReminderDate = today;
          }
        } 
        // Stage 2: Warning (3-4 days overdue)
        else if (daysOverdue >= 3 && daysOverdue < 5 && rider.reminderEscalationStage < 2) {
          success = await sendAutomatedPaymentLink(rider, 'warning');
          if (success) {
            rider.reminderEscalationStage = 2;
            rider.lastAutomatedReminderDate = today;
          }
        }
        // Stage 3: Final (5-6 days overdue)
        else if (daysOverdue >= 5 && daysOverdue < 7 && rider.reminderEscalationStage < 3) {
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
