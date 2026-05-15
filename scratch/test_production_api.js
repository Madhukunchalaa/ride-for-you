const axios = require('axios');

async function testProductionAPI() {
  const url = 'https://rideforyouev.com/api/analytics/dashboard?timeframe=yearly';
  try {
    console.log(`📡 Fetching from production API: ${url}...`);
    const response = await axios.get(url);
    console.log('\nResponse Data:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error fetching production API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testProductionAPI();
