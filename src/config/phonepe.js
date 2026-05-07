const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const PHONEPE_ENV = process.env.PHONEPE_ENV || 'production';

const CLIENT_ID = process.env.PHONEPE_MERCHANT_ID || 'SU2605061800049519220779';
const CLIENT_SECRET = process.env.PHONEPE_SALT_KEY || '52a163e1-4894-4c48-98a9-e07a583d0348';
const CLIENT_VERSION = process.env.PHONEPE_SALT_INDEX || '1';

// Base domains
const BASE_URL = PHONEPE_ENV === 'production'
  ? 'https://api.phonepe.com/apis/pg'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

const OAUTH_URL = PHONEPE_ENV === 'production'
  ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';

/**
 * Fetches OAuth Access Token for PhonePe V2 Standard Checkout
 */
const getAccessToken = async () => {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('client_version', CLIENT_VERSION);

  const response = await axios.post(OAUTH_URL, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data.access_token;
};

/**
 * Helper to generate the X-VERIFY checksum for Webhook callbacks
 */
const generateXVerify = (payload, endpoint) => {
  // webhook verifies response + client_secret
  const stringToHash = payload + CLIENT_SECRET;
  const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
  return `${sha256}###${CLIENT_VERSION}`;
};

/**
 * Create a PhonePe checkout session (Redirect URL) using V2 REST API
 * @param {Object} params
 * @param {string} params.riderId
 * @param {number} params.amount - in paise (INR * 100)
 * @param {string} params.mobileNumber - Rider's phone number
 * @param {string} params.description - Checkout description
 * @param {string} [params.callbackUrl] - Optional server-to-server callback overrides
 * @param {string} [params.redirectUrl] - Optional client redirect overrides
 */
const createPaymentLink = async ({ riderId, amount, description, mobileNumber, callbackUrl, redirectUrl }) => {
  try {
    const accessToken = await getAccessToken();
    const endpoint = '/checkout/v2/pay';
    const uniqueTxId = `tx_${riderId.toString().slice(-12)}_${Date.now().toString().slice(-6)}`;

    let cleanPhone = mobileNumber ? mobileNumber.trim().replace(/\s+/g, '') : '';
    if (cleanPhone && !cleanPhone.startsWith('+91') && cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    }

    const payload = {
      merchantOrderId: uniqueTxId,
      amount: Math.round(amount), // in paise
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: description || `Weekly EV Rental - Rider ID: ${riderId}`,
        merchantUrls: {
          redirectUrl: redirectUrl || process.env.PHONEPE_REDIRECT_URL || `${process.env.FRONTEND_URL || 'https://rideforyouev.com'}/thank-you`
        }
      },
      prefillUserLoginDetails: {
        phoneNumber: cleanPhone
      }
    };

    console.log(`📡 [PHONEPE V2] Requesting checkout for Rider ${riderId}, TXN ID: ${uniqueTxId}, Amount: ${amount} paise...`);

    const response = await axios.post(`${BASE_URL}${endpoint}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    });

    if (response.data) {
      const url = response.data.redirectUrl || response.data.data?.redirectUrl;
      if (url) {
        console.log(`✅ [PHONEPE V2] Session Created! URL: ${url}`);
        return {
          success: true,
          url,
          id: uniqueTxId
        };
      }
    }
    throw new Error(response.data?.message || 'Failed to retrieve checkout URL from response');
  } catch (error) {
    const apiError = error.response?.data;
    console.error('💥 [PHONEPE V2] Payment Link Error:', apiError || error.message);
    throw new Error(apiError?.message || error.message || 'PhonePe V2 integration failure');
  }
};

/**
 * Check payment status of a merchantTransactionId (V2)
 * @param {string} merchantTransactionId
 */
const checkPaymentStatus = async (merchantTransactionId) => {
  try {
    const accessToken = await getAccessToken();
    const endpoint = `/checkout/v2/order/${merchantTransactionId}/status`;

    console.log(`📡 [PHONEPE V2] Checking transaction status for Order ID: ${merchantTransactionId}...`);

    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${accessToken}`
      }
    });

    if (response.data) {
      const code = response.data.code;
      const state = response.data.state || response.data.data?.state || response.data.data?.paymentState;
      const amountVal = response.data.amount || response.data.data?.amount;

      console.log(`✅ [PHONEPE V2] Status response for Order ID ${merchantTransactionId}: ${code}, state: ${state}`);

      return {
        success: true,
        code, // e.g. 'PAYMENT_SUCCESS'
        paymentState: state, // e.g. 'COMPLETED', 'FAILED', 'PENDING'
        amount: amountVal ? amountVal / 100 : 0, // Convert from paise to rupees
        merchantTransactionId: merchantOrderId
      };
    } else {
      console.warn(`⚠️ [PHONEPE V2] Status check returned success=false:`, response.data);
      return {
        success: false,
        message: response.data?.message || 'Failed to fetch status'
      };
    }
  } catch (error) {
    console.error('💥 [PHONEPE V2] Status Check Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  createPaymentLink,
  checkPaymentStatus,
  generateXVerify,
  MERCHANT_ID: CLIENT_ID, // Map to CLIENT_ID for webhook compatibility
  SALT_KEY: CLIENT_SECRET, // Map to CLIENT_SECRET for webhook compatibility
  SALT_INDEX: CLIENT_VERSION, // Map to CLIENT_VERSION for webhook compatibility
  PHONEPE_ENV,
  BASE_URL
};
