const axios = require('axios');

const metaConfig = {
  accessToken: process.env.META_ACCESS_TOKEN,
  phoneNumberId: process.env.META_PHONE_NUMBER_ID,
  wabaId: process.env.META_WABA_ID,
  version: process.env.META_VERSION || 'v21.0',
  baseUrl: 'https://graph.facebook.com'
};

const metaApi = axios.create({
  baseURL: `${metaConfig.baseUrl}/${metaConfig.version}/${metaConfig.phoneNumberId}`,
  headers: {
    'Authorization': `Bearer ${metaConfig.accessToken}`,
    'Content-Type': 'application/json'
  }
});

module.exports = { metaConfig, metaApi };
