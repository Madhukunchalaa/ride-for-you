require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({ role: 'admin' });
    console.log('🗑️  Existing admins cleared');

    // Create Admin
    const admin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@evride.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@1234',
      role: 'admin'
    });

    console.log(`👤 Admin Created successfully!`);
    console.log(`Email: ${admin.email}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Seeding Error: ${err.message}`);
    process.exit(1);
  }
};

seedAdmin();
