const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const SystemConfig = require('../models/SystemConfig');

/**
 * UTILITY SCRIPT: updateConfig.js
 * Usage: node src/utils/updateConfig.js appId secretKey
 */

const appId = process.argv[2];
const secretKey = process.argv[3];

if (!appId || !secretKey) {
  console.error('❌ Error: Please provide appId and secretKey');
  console.log('Usage: node src/utils/updateConfig.js YOUR_APP_ID YOUR_SECRET_KEY');
  process.exit(1);
}

const update = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    const configData = {
      appId: appId.trim(),
      secretKey: secretKey.trim()
    };

    await SystemConfig.findOneAndUpdate(
      { key: 'CASHFREE' },
      { 
        key: 'CASHFREE',
        value: configData,
        description: 'Cashfree Production/Sandbox Credentials',
        updatedBy: 'manual_script'
      },
      { upsert: true, new: true }
    );

    console.log('✨ SUCCESS: Cashfree credentials saved to Database!');
    console.log(`   - App ID: ${appId.trim()}`);
    console.log('---');
    console.log('The server will pick these up automatically on the next request.');
    
    process.exit(0);
  } catch (err) {
    console.error('💥 FATAL ERROR:', err.message);
    process.exit(1);
  }
};

update();
