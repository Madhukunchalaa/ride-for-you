require('dotenv').config();
const mongoose = require('mongoose');
const Rider = require('../models/Rider');
const Invoice = require('../models/Invoice');

const seedHistoricalData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data for a clean graph
    await Rider.deleteMany({});
    await Invoice.deleteMany({});
    console.log('🗑️  Existing data cleared for clean trend lines');

    const names = ['Arjun', 'Bhuvan', 'Chitra', 'Deepak', 'Esha', 'Farhan', 'Gauri', 'Hari', 'Isha', 'Jatin', 'Kiran', 'Lata', 'Manoj', 'Nisha', 'Om'];
    const vehicles = ['KA-01-EV-1001', 'KA-01-EV-1002', 'KA-01-EV-1003', 'KA-01-EV-1004', 'KA-01-EV-1005', 'KA-02-EV-2001', 'KA-02-EV-2002', 'KA-03-EV-3001', 'KA-04-EV-4001', 'KA-05-EV-5001'];

    console.log('🌱 Generating 10 days of historical data...');

    const riders = [];
    const invoices = [];

    for (let i = 0; i < 15; i++) {
      // Days ago: from 9 days ago to today
      const daysAgo = Math.floor(Math.random() * 10);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      const rider = {
        name: names[i % names.length],
        whatsappNumber: `919420${1000 + i}`,
        vehicleNumber: vehicles[i % vehicles.length],
        riderStatus: i % 5 === 0 ? 'inactive' : 'active',
        paymentStatus: i % 3 === 0 ? 'unpaid' : 'paid',
        deployDate: createdAt,
        returnDate: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        totalWeeks: Math.floor(Math.random() * 5) + 1,
        bikesUsed: [vehicles[i % vehicles.length]],
        createdAt: createdAt,
        updatedAt: createdAt
      };
      riders.push(rider);
    }

    const savedRiders = await Rider.insertMany(riders);
    console.log(`✅ ${savedRiders.length} Riders seeded with historical dates.`);

    for (let i = 0; i < 25; i++) {
        const randomRider = savedRiders[Math.floor(Math.random() * savedRiders.length)];
        const daysAgo = Math.floor(Math.random() * 10);
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        invoices.push({
            billingMonth: 'April 2026',
            riderId: randomRider._id,
            riderName: randomRider.name,
            invoiceType: 'RENT',
            invoiceNum: `INV-2026-${1000 + i}`,
            billAmount: 2000,
            actualRent: 2000,
            remarks: 'Historical Rental Payment',
            createdAt: createdAt,
            updatedAt: createdAt
        });
    }

    await Invoice.insertMany(invoices);
    console.log(`✅ ${invoices.length} Invoices seeded with historical dates.`);

    console.log('🚀 Dashboard trends are now fully populated!');
    process.exit(0);
  } catch (err) {
    console.error(`❌ Seeding Error: ${err.message}`);
    process.exit(1);
  }
};

seedHistoricalData();
