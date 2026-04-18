const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Check if admin already exists to avoid unnecessary deletions
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('✅ Admin user already exists');
      return;
    }

    console.log('🌱 Seeding Admin User...');
    
    const admin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@evride.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@1234',
      role: 'admin'
    });

    console.log(`👤 Admin Created successfully: ${admin.email}`);
  } catch (err) {
    console.error(`❌ Seeding Error: ${err.message}`);
  }
};

module.exports = { seedAdmin };
