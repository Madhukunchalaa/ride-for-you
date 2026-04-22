const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const Rider = require('../models/Rider');
const cashfreeConfig = require('../config/cashfree');

const debugCashfree = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const rider = await Rider.findOne({ whatsappNumber: '7095682464' });

    console.log('🔍 Testing Cashfree with Payload...');
    
    const uniqueLinkId = `debug_${Date.now()}`;
    const payload = {
      link_id: uniqueLinkId,
      link_amount: 1,
      link_currency: "INR",
      link_purpose: "Debug Test",
      customer_details: {
        customer_phone: rider.whatsappNumber, // Is this 10 digits?
        customer_name: rider.name
      }
    };

    console.log('📡 Payload:', JSON.stringify(payload, null, 2));
    console.log('📡 Base URL:', cashfreeConfig.baseUrl);

    try {
      const response = await axios.post(`${cashfreeConfig.baseUrl}/links`, payload, {
        headers: {
          'x-client-id': cashfreeConfig.clientId,
          'x-client-secret': cashfreeConfig.clientSecret,
          'x-api-version': cashfreeConfig.apiVersion,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ SUCCESS:', response.data);
    } catch (err) {
      console.error('❌ FAILED with Status:', err.response?.status);
      console.error('❌ Error Data:', JSON.stringify(err.response?.data, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

debugCashfree();
