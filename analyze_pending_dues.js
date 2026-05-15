const mongoose = require('mongoose');
require('dotenv').config();

const RiderSchema = new mongoose.Schema({
  name: String,
  riderStatus: String,
  paymentStatus: String,
  deployDate: Date,
  returnDate: Date,
  totalWeeks: Number,
  rentalRate: Number,
  isRecoveryBucket: Boolean
}, { strict: false });

const Rider = mongoose.models.Rider || mongoose.model('Rider', RiderSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ride-for-you');
    console.log('Connected to MongoDB');

    const activeRiders = await Rider.find({ riderStatus: 'active' });
    console.log(`Total Active Riders: ${activeRiders.length}`);

    const globalWeeklyRate = 2000;
    const ridersWithDues = [];

    activeRiders.forEach(rider => {
      const rate = rider.rentalRate || globalWeeklyRate;
      const deployDate = rider.deployDate;
      const paidWeeks = rider.totalWeeks || 0;
      
      let unpaidWeeks = 0;
      if (!deployDate) {
        unpaidWeeks = rider.paymentStatus === 'unpaid' ? 1 : 0;
      } else {
        const end = (rider.riderStatus === 'returned' && rider.returnDate) ? new Date(rider.returnDate) : new Date();
        const diffTime = Math.abs(end - new Date(deployDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);
        unpaidWeeks = Math.max(0, currentWeek - paidWeeks);
      }

      const dueAmount = unpaidWeeks * rate;
      if (dueAmount > 0) {
        ridersWithDues.push({
          name: rider.name,
          deployDate: rider.deployDate ? rider.deployDate.toISOString().split('T')[0] : 'N/A',
          paidWeeks,
          unpaidWeeks,
          dueAmount
        });
      }
    });

    // Sort by dueAmount descending
    ridersWithDues.sort((a, b) => b.dueAmount - a.dueAmount);

    console.log('\n--- TOP 15 RIDERS WITH HIGHEST PENDING DUES ---');
    ridersWithDues.slice(0, 15).forEach((r, idx) => {
      console.log(`${idx + 1}. Name: ${r.name} | Deployed: ${r.deployDate} | Paid Weeks: ${r.paidWeeks} | Unpaid Weeks: ${r.unpaidWeeks} | Owed: ₹${r.dueAmount.toLocaleString()}`);
    });

    const totalCalculated = ridersWithDues.reduce((acc, r) => acc + r.dueAmount, 0);
    console.log(`\nTotal Calculated Dues across all active fleet: ₹${totalCalculated.toLocaleString()}`);

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
