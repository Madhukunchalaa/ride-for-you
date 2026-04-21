const clean = (val) => (val || '').trim().replace(/^["']|["']$/g, '');

const clientId = clean(process.env.CASHFREE_APP_ID);
const clientSecret = clean(process.env.CASHFREE_SECRET_KEY);

const isTestKey = clientId.startsWith('TEST') || clientSecret.startsWith('cfsk_ma_test');

console.log(`💳 Cashfree API Config: ${isTestKey ? 'SANDBOX' : 'PRODUCTION'} (ID: ${clientId.substring(0, 8)}...)`);

const cashfreeConfig = {
  baseUrl: isTestKey 
    ? 'https://sandbox.cashfree.com/pg' 
    : 'https://api.cashfree.com/pg',
  clientId,
  clientSecret,
  apiVersion: '2023-08-01'
};

module.exports = cashfreeConfig;
