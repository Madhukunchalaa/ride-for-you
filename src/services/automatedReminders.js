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
        const returnDate = new Date(rider.returnDate);
        // Normalize dates to midnight for accurate day comparison
        const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const returnAtMidnight = new Date(returnDate.getFullYear(), returnDate.getMonth(), returnDate.getDate());
        const daysOverdue = Math.floor((todayAtMidnight - returnAtMidnight) / (1000 * 60 * 60 * 24));
        
        const lastSentDate = rider.lastAutomatedReminderDate ? new Date(rider.lastAutomatedReminderDate).toDateString() : null;
        
        // Prevent sending multiple reminders on the same day
        if (lastSentDate === today.toDateString()) continue;

        // Check if it's the exact time to send (or if they are already overdue)
        if (currentTime !== rider.autoReminderTime && daysOverdue <= 0) continue;

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
