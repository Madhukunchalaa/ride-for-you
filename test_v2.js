const axios = require('axios');
require('dotenv').config();

const CLIENT_ID = process.env.PHONEPE_MERCHANT_ID || 'SU2605061800049519220779';
const CLIENT_SECRET = process.env.PHONEPE_SALT_KEY || '52a163e1-4894-4c48-98a9-e07a583d0348';
const CLIENT_VERSION = process.env.PHONEPE_SALT_INDEX || '1';

const BASE_URL = 'https://api.phonepe.com/apis/pg'; // Production V2 Base

async function runV2Test() {
  console.log('🏁 Starting PhonePe V2 Production Gateway Live Test...');
  console.log(`- Base URL: ${BASE_URL}`);
  console.log(`- Client ID: ${CLIENT_ID.substring(0, 6)}...${CLIENT_ID.slice(-6)}`);
  console.log(`- Client Secret: ${CLIENT_SECRET.substring(0, 4)}...${CLIENT_SECRET.slice(-4)}`);
  console.log(`- Client Version: ${CLIENT_VERSION}`);

  try {
    // 1. Fetch OAuth Access Token
    console.log('\n🔑 [1/2] Fetching OAuth Access Token from /identity-manager/v1/oauth/token...');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('client_version', CLIENT_VERSION);

    const tokenResponse = await axios.post(`https://api.phonepe.com/apis/identity-manager/v1/oauth/token`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ OAuth Authentication Successful!');
    console.log(`- Access Token retrieved: ${accessToken.substring(0, 10)}...${accessToken.slice(-10)}`);

    // 2. Request V2 Checkout session
    console.log('\n🚀 [2/2] Generating Rs. 1 Production Checkout URL (/checkout/v2/pay)...');
    
    const uniqueTxId = `tx_${Date.now().toString().slice(-12)}`;
    const payload = {
      merchantOrderId: uniqueTxId,
      amount: 100, // 100 paise = Rs. 1
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: 'Live Rs. 1 EV Rental Verification Test',
        merchantUrls: {
          redirectUrl: 'https://rideforyouev.com/thank-you'
        }
      }
    };

    const payResponse = await axios.post(`${BASE_URL}/checkout/v2/pay`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    });

    console.log('\n🎉 SUCCESS! PHONEPE V2 LIVE CHECKOUT SESSION CREATED!');
    console.log(`- Transaction Order ID: ${uniqueTxId}`);
    console.log(`- Checkout URL:`);
    console.log(`  👉 ${payResponse.data.redirectUrl || payResponse.data.data?.redirectUrl}`);

  } catch (error) {
    console.error('\n❌ PhonePe V2 API Error:');
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Data:', error.response.data);
    } else {
      console.error('- Message:', error.message);
    }
  }
}

runV2Test();
