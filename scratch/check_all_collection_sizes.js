const mongoose = require('mongoose');
require('dotenv').config();

async function checkAll() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://rideforyouev_db_user:58xkKCkO4yiOEXow@cluster0.1taetwt.mongodb.net/ev_rental?retryWrites=true&w=majority&appName=Cluster0";
  
  try {
    console.log('📡 Connecting...');
    await mongoose.connect(uri);
    console.log('✅ Connected.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n--- COLLECTION SIZES ---');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`${col.name.padEnd(20)}: ${count} documents`);
    }

    console.log('\n--- SAMPLE INVOICE ---');
    const invoiceCol = db.collection('invoices');
    const invoiceSample = await invoiceCol.findOne({});
    console.log(JSON.stringify(invoiceSample, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

checkAll();
