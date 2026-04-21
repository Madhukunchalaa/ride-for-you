const clean = (val) => (val || '').trim().replace(/^["']|["']$/g, '');

// DEBUG: Comprehensive environment check
const requiredKeys = ['CASHFREE_APP_ID', 'CASHFREE_SECRET_KEY'];
const foundKeys = Object.keys(process.env).filter(k => k.toUpperCase().includes('CASH'));

console.log('--- 💳 CASHFREE DIAGNOSTICS ---');
console.log(`🔍 Detected environment keys: [${foundKeys.join(', ')}]`);

requiredKeys.forEach(key => {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ MISSING: ${key} is not defined in process.env`);
    // Check for common typos or case issues
    const similar = foundKeys.find(k => k !== key && k.toUpperCase() === key.toUpperCase());
    if (similar) {
      console.warn(`💡 HINT: Found ${similar} which might be a typo for ${key}`);
    }
  } else {
    const cleaned = clean(value);
    console.log(`✅ FOUND: ${key} (Length: ${value.length}, Clean Length: ${cleaned.length})`);
    if (value !== cleaned) {
      console.log(`ℹ️ NOTE: ${key} was cleaned (had quotes or spaces)`);
    }
  }
});

const clientId = clean(process.env.CASHFREE_APP_ID);
const clientSecret = clean(process.env.CASHFREE_SECRET_KEY);

const isTestKey = clientId.startsWith('TEST') || clientSecret.startsWith('cfsk_ma_test');

console.log(`💳 Mode: ${isTestKey ? 'SANDBOX' : 'PRODUCTION'}`);
console.log(`💳 Client ID: ${clientId ? clientId.substring(0, 8) + '...' : 'MISSING'}`);
console.log('-------------------------------');

const cashfreeConfig = {
  baseUrl: isTestKey 
    ? 'https://sandbox.cashfree.com/pg' 
    : 'https://api.cashfree.com/pg',
  clientId,
  clientSecret,
  apiVersion: '2023-08-01',
  isConfigured: !!(clientId && clientSecret)
};

module.exports = cashfreeConfig;
