const mongoose = require('mongoose');
require('dotenv').config();
const Invoice = require('./src/models/Invoice');
const Rider = require('./src/models/Rider');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB.');

    // Today's date window: May 12, 2026
    const startDate = new Date('2026-05-12T00:00:00.000Z');
    const endDate = new Date('2026-05-12T23:59:59.999Z');

    console.log(`\n🔎 Querying invoices between ${startDate.toISOString()} and ${endDate.toISOString()}...\n`);

    const invoices = await Invoice.find({
      riderId: { $ne: null },
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('riderId', 'name');

    console.log(`📊 Found ${invoices.length} rental invoices created today:`);
    console.log('--------------------------------------------------');
    
    let total = 0;
    invoices.forEach((inv, i) => {
      const riderName = inv.riderId ? inv.riderId.name : 'Unknown Rider';
      const amount = inv.billAmount || 0;
      total += amount;
      console.log(`[${i + 1}] Invoice: ${inv.invoiceNum} | Rider: ${riderName} | Amount: ₹${amount} | CreatedAt: ${inv.createdAt.toISOString()}`);
    });

    console.log('--------------------------------------------------');
    console.log(`✨ Total Sum Calculated: ₹${total}\n`);

    process.exit(0);
  } catch (err) {
    console.error('💥 Error running script:', err);
    process.exit(1);
  }
}

run();
