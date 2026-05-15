const axios = require('axios');

async function testCustomPayment() {
  const url = 'http://localhost:5000/api/payments/custom';
  const payload = {
    name: 'Test User',
    whatsappNumber: '7095682464',
    amount: 1,
    remarks: 'Testing custom payment link trigger',
    paymentMethod: 'ONLINE_LINK'
  };

  try {
    console.log('📡 Sending request to create Custom Payment Link...');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(url, payload);
    
    console.log('\n✅ [SUCCESS] Custom Payment API Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\n❌ [ERROR] Custom Payment API Failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testCustomPayment();
