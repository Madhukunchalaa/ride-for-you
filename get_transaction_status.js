const mongoose = require('mongoose');
const phonepe = require('./src/config/phonepe');
require('dotenv').config();

async function checkTxStatus() {
  const txId = 'tx_759bb8fba7b9_292618';
  console.log(`📡 [STATUS-CHECK] Querying PhonePe V2 Status for Transaction ID: "${txId}"...`);
  
  try {
    const status = await phonepe.checkPaymentStatus(txId);
    console.log('\n📊 PHONEPE STATUS API RESPONSE:');
    console.log(JSON.stringify(status, null, 2));
  } catch (err) {
    console.error('❌ Failed to fetch transaction status:', err);
  }
}

checkTxStatus();
