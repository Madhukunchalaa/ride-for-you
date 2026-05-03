require('dotenv').config();
const mongoose = require('mongoose');

const cleanDatabase = async () => {
  try {
    console.log('🧹 Connecting to Database...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Delete all Riders
    const riderResult = await mongoose.connection.collection('riders').deleteMany({});
    console.log(`✅ Deleted ${riderResult.deletedCount} Riders`);
    
    // 2. Delete all Invoices (Payment records)
    const invoiceResult = await mongoose.connection.collection('invoices').deleteMany({});
    console.log(`✅ Deleted ${invoiceResult.deletedCount} Invoices (Revenue reset)`);

    // 3. Delete all Expenses
    const expenseResult = await mongoose.connection.collection('expenses').deleteMany({});
    console.log(`✅ Deleted ${expenseResult.deletedCount} Expenses (Profit reset)`);

    // 4. Delete all Customers (Leads)
    try {
      const customerResult = await mongoose.connection.collection('customers').deleteMany({});
      console.log(`✅ Deleted ${customerResult.deletedCount} Customers`);
    } catch (e) {}

    // 4. Delete Fleet History (The graph data)
    try {
      const fleetResult = await mongoose.connection.collection('fleet_history').deleteMany({});
      console.log(`✅ Deleted ${fleetResult.deletedCount} Fleet History records`);
    } catch (e) {}

    console.log('✨ Database is now 100% CLEAN and Production Ready!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup Failed:', err.message);
    process.exit(1);
  }
};

cleanDatabase();
