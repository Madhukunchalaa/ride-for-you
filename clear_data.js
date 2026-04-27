require('dotenv').config();
const mongoose = require('mongoose');
const Rider = require('./src/models/Rider');
const Invoice = require('./src/models/Invoice');
const Expense = require('./src/models/Expense');
const Customer = require('./src/models/customer');
const User = require('./src/models/User');

const clearData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!');

    console.log('🧹 Clearing sample data...');
    
    const riderResult = await Rider.deleteMany({});
    const invoiceResult = await Invoice.deleteMany({});
    const expenseResult = await Expense.deleteMany({});
    const customerResult = await Customer.deleteMany({});
    
    // We keep all Users except those that might be samples? 
    // Usually it's safer to just keep the User collection as is or only delete non-admins.
    // For now, let's keep all Users to avoid locking you out.
    
    console.log(`✨ Cleanup Complete!`);
    console.log(`- Removed ${riderResult.deletedCount} Riders`);
    console.log(`- Removed ${invoiceResult.deletedCount} Invoices`);
    console.log(`- Removed ${expenseResult.deletedCount} Expenses`);
    console.log(`- Removed ${customerResult.deletedCount} Customers`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  }
};

clearData();
