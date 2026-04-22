const SystemConfig = require('../models/SystemConfig');

/**
 * Trims and cleans values from environment or database.
 */
const clean = (val) => {
  if (!val) return '';
  return val
    .toString()
    .trim()
    .replace(/^["']|["']$/g, '') // Strip leading/trailing quotes
    .trim();
};

/**
 * Dynamically fetches Cashfree configuration.
 * Priority: 1. Database (SystemConfig collection) 2. Environment Variables
 */
const getCashfreeConfig = async () => {
  let clientId = '';
  let clientSecret = '';

  try {
    // 1. Try fetching from Database
    const dbConfig = await SystemConfig.findOne({ key: 'CASHFREE' });
    if (dbConfig && dbConfig.value) {
      clientId = clean(dbConfig.value.appId);
      clientSecret = clean(dbConfig.value.secretKey);
      if (clientId && clientSecret) {
        // console.log('💳 Config: Loaded from Database');
      }
    }
  } catch (err) {
    console.error('⚠️ Falling back to ENV: Error reading SystemConfig:', err.message);
  }

  // 2. Fallback to Environment Variables if DB is empty
  if (!clientId) {
    clientId = clean(process.env.CASHFREE_APP_ID || '');
    // if (clientId) console.log('💳 Config: Loaded from CASHFREE_APP_ID');
  }
  if (!clientSecret) {
    clientSecret = clean(process.env.CASHFREE_SECRET_KEY || '');
  }

  const isTestKey = clientId.startsWith('TEST') || clientSecret.startsWith('cfsk_ma_test');

  return {
    baseUrl: isTestKey 
      ? 'https://sandbox.cashfree.com/pg' 
      : 'https://api.cashfree.com/pg',
    clientId,
    clientSecret,
    apiVersion: '2023-08-01',
    isConfigured: !!(clientId && clientSecret)
  };
};

module.exports = { getCashfreeConfig };
