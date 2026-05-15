const mongoose = require('mongoose');
require('dotenv').config();
const Rider = require('../src/models/Rider');

// Dynamic lookup of schemas
async function checkDB() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://rideforyouev_db_user:58xkKCkO4yiOEXow@cluster0.1taetwt.mongodb.net/ev_rental?retryWrites=true&w=majority&appName=Cluster0";
  
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected.');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in Database:', collections.map(c => c.name));

    const ridersCount = await Rider.countDocuments();
    console.log(`Total Riders: ${ridersCount}`);

    const activeRidersCount = await Rider.countDocuments({ riderStatus: 'active' });
    console.log(`Active Riders: ${activeRidersCount}`);

    // Check if there is an Invoice or Payment model
    let invoicesCount = 0;
    try {
      const Invoice = mongoose.model('Invoice') || mongoose.model('Payment');
      invoicesCount = await Invoice.countDocuments();
      console.log(`Total Invoices: ${invoicesCount}`);
    } catch (e) {
      console.log(`Could not find Invoice model directly. Checking dynamically via DB...`);
      const paymentCol = mongoose.connection.db.collection('payments') || mongoose.connection.db.collection('invoices');
      if (paymentCol) {
        const count = await paymentCol.countDocuments();
        console.log(`Documents in 'payments' or 'invoices' collection: ${count}`);
        
        // Show last 3 payments
        const lastPayments = await paymentCol.find({}).sort({ createdAt: -1 }).limit(3).toArray();
        console.log('Last 3 payments:', JSON.stringify(lastPayments, null, 2));
      }
    }

    // Let's print out 3 riders to inspect their fields
    const sampleRiders = await Rider.find({}).limit(3);
    console.log('\nSample Riders:', JSON.stringify(sampleRiders, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

checkDB();
