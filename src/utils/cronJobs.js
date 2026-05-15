const cron = require('node-cron');
const Rider = require('../models/Rider');

/**
 * Weekly Status Reset Job
 * Runs every day at midnight (00:00)
 * Logic: If current date >= returnDate AND paymentStatus is 'paid', 
 * then set paymentStatus to 'unpaid' for the new week.
 */
const initCronJobs = () => {
  // Run everyday at 23:55 IST so midnight reminders work perfectly
  // For testing, we can run it every minute or on demand: '* * * * *'
  cron.schedule('55 23 * * *', async () => {
    console.log('🕒 Running Weekly Status Reset Job...');
    try {
      const today = new Date();
      
      // Find active riders whose returnDate is today or in the past
      const ridersToReset = await Rider.find({
        riderStatus: 'active',
        paymentStatus: 'paid',
        returnDate: { $lte: today }
      });

      if (ridersToReset.length > 0) {
        for (const rider of ridersToReset) {
          rider.paymentStatus = 'unpaid';
          await rider.save();
          console.log(`✅ Reset payment status for rider: ${rider.name} (Vehicle: ${rider.vehicleNumber})`);
        }
        console.log(`📊 Successfully reset ${ridersToReset.length} riders.`);
      } else {
        console.log('ℹ️ No riders require status reset today.');
      }
    } catch (err) {
      console.error('❌ Error in Weekly Status Reset Job:', err);
    }
  }, {
    timezone: "Asia/Kolkata"
  });

  console.log('🚀 Background Cron Jobs Initialized.');
};

module.exports = { initCronJobs };
