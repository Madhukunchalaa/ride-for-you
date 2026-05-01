require('dotenv').config();
const { sendPaymentReminder } = require('./src/utils/whatsapp');

const testNumber = '7095682464';

async function sendTest() {
    console.log(`🚀 Sending test WhatsApp message to ${testNumber}...`);
    try {
        const result = await sendPaymentReminder(testNumber, {
            body: "Hello! This is a test message from Ride For You local server. ⚡"
        });
        console.log('✅ Test message sent successfully!');
        console.log('SID:', result.sid);
    } catch (err) {
        console.error('❌ Failed to send test message:');
        console.error(err.message);
        if (err.code) console.error('Error Code:', err.code);
    }
}

sendTest();
