const mongoose = require('mongoose');
require('dotenv').config();
const Rider = require('../src/models/Rider');
const Invoice = require('../src/models/Invoice');

async function testAggregation() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://rideforyouev_db_user:58xkKCkO4yiOEXow@cluster0.1taetwt.mongodb.net/ev_rental?retryWrites=true&w=majority&appName=Cluster0";
  
  try {
    console.log('📡 Connecting...');
    await mongoose.connect(uri);
    console.log('✅ Connected.');

    const timeframe = 'yearly';
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);
    startDate.setHours(0, 0, 0, 0);

    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    console.log(`\nQuery bounds:`);
    console.log(`Start Date: ${startDate.toISOString()}`);
    console.log(`End Date: ${endDate.toISOString()}`);

    // Check count of invoices within bounds
    const totalInvoicesInBounds = await Invoice.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    console.log(`Total Invoices in bounds: ${totalInvoicesInBounds}`);

    // Run revenue aggregation matching analyticsController
    const revenueMatch = { riderId: { $ne: null }, createdAt: { $gte: startDate } };
    console.log('\nRevenue Match object:', JSON.stringify(revenueMatch, null, 2));

    const revenueStats = await Invoice.aggregate([
      { $match: revenueMatch },
      { $group: { _id: null, total: { $sum: "$billAmount" } } }
    ]);
    console.log('Revenue Aggregation result:', JSON.stringify(revenueStats, null, 2));

    // Run expense aggregation matching analyticsController
    const expenseMatch = { riderId: { $eq: null }, createdAt: { $gte: startDate } };
    console.log('\nExpense Match object:', JSON.stringify(expenseMatch, null, 2));

    const expenseStats = await Invoice.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, total: { $sum: "$actualRent" } } }
    ]);
    console.log('Expense Aggregation result:', JSON.stringify(expenseStats, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

testAggregation();
