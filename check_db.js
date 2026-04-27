require('dotenv').config();
const mongoose = require('mongoose');

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to:', mongoose.connection.name);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections in DB:');
    
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count} documents`);
      
      if (count > 0 && col.name === 'invoices') {
        const sample = await mongoose.connection.db.collection(col.name).findOne();
        console.log('  Sample Invoice:', JSON.stringify(sample, null, 2));
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDb();
