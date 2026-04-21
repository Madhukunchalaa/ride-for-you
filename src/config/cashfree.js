const clean = (val) => (val || '').trim().replace(/^["']|["']$/g, '');

// DEBUG: List all 'CASH' related environment keys (names only)
const cashKeys = Object.keys(process.env).filter(k => k.toUpperCase().includes('CASH'));
console.log(`🔍 Detected Cashfree-related keys in Railway: [${cashKeys.join(', ')}]`);

const clientId = clean(process.env.CASHFREE_APP_ID);
const clientSecret = clean(process.env.CASHFREE_SECRET_KEY);

if (!clientId || !clientSecret) {
  console.error('❌ CRITICAL: Cashfree API credentials (CASHFREE_APP_ID/CASHFREE_SECRET_KEY) are MISSING in the environment.');
  if (cashKeys.length > 0) {
    console.log(`💡 Hint: We found these similar keys: ${cashKeys.join('. ')}. Make sure they match 'CASHFREE_APP_ID' exactly.`);
  }
}

const isTestKey = clientId.startsWith('TEST') || clientSecret.startsWith('cfsk_ma_test');

console.log(`💳 Cashfree API Config: ${isTestKey ? 'SANDBOX' : 'PRODUCTION'} (ID: ${clientId ? clientId.substring(0, 8) + '...' : 'MISSING'})`);

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
