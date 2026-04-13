const cron = require('node-cron');
const Rider = require('../models/Rider');
const { sendPaymentReminder } = require('../utils/whatsapp');

/**
 * Initializes the weekly payment reminder scheduler.
 */
const initPaymentScheduler = () => {
  // Schedule: Run every Monday at 9:00 AM
  // 0 9 * * 1
  cron.schedule('0 9 * * 1', async () => {
    console.log('⏰ Running weekly payment reminder job...');

    try {
      const activeRiders = await Rider.find({ riderStatus: 'active' });

      for (const rider of activeRiders) {
        const variables = {
          "1": rider.name,
          "2": new Date(rider.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        };

        try {
          await sendPaymentReminder(rider.whatsappNumber, variables);
          console.log(`✅ Automated reminder sent to ${rider.name}`);
        } catch (err) {
          console.error(`❌ Failed to send automated reminder to ${rider.name}:`, err.message);
        }
      }
    } catch (err) {
      console.error('❌ Scheduler Job Error:', err.message);
    }
  });

  console.log('🚀 Weekly Payment Scheduler Initialized (Mon 9:00 AM)');
};

module.exports = { initPaymentScheduler };
