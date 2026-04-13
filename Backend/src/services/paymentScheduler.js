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
        const returnDate = new Date(rider.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const body = `💳 *Weekly Payment Reminder*\n\nHello ${rider.name},\nYour rental payment for vehicle ${rider.vehicleNumber} is due on ${returnDate}.\n\nScan the QR code or tap this link to pay:\n${upiUrl}`;

        // Generate public QR code URL
        const upiUrl = `upi://pay?pa=yourname@upi&pn=RideForYou&am=2000&cu=INR`;
        const mediaUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;

        try {
          await sendPaymentReminder(rider.whatsappNumber, { body, mediaUrl });
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
