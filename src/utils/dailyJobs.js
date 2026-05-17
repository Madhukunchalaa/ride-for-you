const cron = require('node-cron');
const Rider = require('../models/Rider');

const initDailyJobs = () => {
  cron.schedule('30 0 * * *', async () => {
    try {
      const now = new Date();
      // Get the current date string in IST (YYYY-MM-DD)
      const istDateString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      // This gives us the exact UTC start of the day in IST
      const istMidnightUTC = new Date(`${istDateString}T00:00:00Z`);
      
      const result = await Rider.updateMany(
        {
          riderStatus: 'active',
          paymentStatus: 'paid',
          returnDate: { $lte: istMidnightUTC }
        },
        { $set: { paymentStatus: 'unpaid' } }
      );
      console.log(`[DailyResetCron ${new Date(istDateString).toDateString()}] Reset ${result.modifiedCount} riders from paid → unpaid`);
    } catch (err) {
      console.error('[DailyResetCron] Failed:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('🚀 Daily Reset Jobs Initialized (00:30 IST)');
};

module.exports = { initDailyJobs };
