const cron = require('node-cron');
const Rider = require('../models/Rider');

const initDailyJobs = () => {
  cron.schedule('30 0 * * *', async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const result = await Rider.updateMany(
        {
          riderStatus: 'active',
          paymentStatus: 'paid',
          returnDate: { $lte: today }
        },
        { $set: { paymentStatus: 'unpaid' } }
      );
      console.log(`[DailyResetCron ${new Date().toISOString()}] Reset ${result.modifiedCount} riders from paid → unpaid`);
    } catch (err) {
      console.error('[DailyResetCron] Failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('🚀 Daily Reset Jobs Initialized (00:30 IST)');
};

module.exports = { initDailyJobs };
