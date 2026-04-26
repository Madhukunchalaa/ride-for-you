require('dotenv').config();
const twilio = require('twilio');

const checkStatus = async (sid) => {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  try {
    const message = await client.messages(sid).fetch();
    console.log(`🔍 Message Status for ${sid}:`);
    console.log(`- Status: ${message.status}`);
    console.log(`- To: ${message.to}`);
    console.log(`- Error Code: ${message.errorCode || 'None'}`);
    console.log(`- Error Message: ${message.errorMessage || 'None'}`);
  } catch (err) {
    console.error('❌ Error fetching message status:', err.message);
  }
};

const sid = process.argv[2] || 'MMe0924ffe6f82e974398574eb8d2a7289';
checkStatus(sid);
