require('dotenv').config();
const mongoose = require('mongoose');

const cleanDatabase = async () => {
  try {
    console.log('🧹 Connecting to Database...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Delete all Riders
    const riderResult = await mongoose.connection.collection('riders').deleteMany({});
    console.log(`✅ Deleted ${riderResult.deletedCount} Riders`);
    
    // 2. Delete all Payments (Optional but recommended for a clean start)
    const paymentResult = await mongoose.connection.collection('payments').deleteMany({});
    console.log(`✅ Deleted ${paymentResult.deletedCount} Payments`);

    // 3. Delete all Expenses (Optional but recommended for a clean start)
    const expenseResult = await mongoose.connection.collection('expenses').deleteMany({});
    console.log(`✅ Deleted ${expenseResult.deletedCount} Expenses`);

    console.log('✨ Database is now Production Ready!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup Failed:', err.message);
    process.exit(1);
  }
};

cleanDatabase();
