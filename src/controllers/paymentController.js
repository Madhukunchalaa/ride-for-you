const crypto = require('crypto');
const Rider = require('../models/Rider');
const phonepe = require('../config/phonepe');

// @POST /api/payments/create-link
// @desc Create a PhonePe Payment Link for WhatsApp/Frontend redirect
exports.createPaymentLink = async (req, res) => {
  try {
    const { riderId, amount } = req.body;
    const rider = await Rider.findById(riderId);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });
    
    // Amount in paise (multiply by 100)
    const amountVal = (amount || 2000) * 100;

    const response = await phonepe.createPaymentLink({
      riderId: rider._id,
      amount: amountVal,
      mobileNumber: rider.whatsappNumber,
      description: `Weekly Rental - ${rider.vehicleNumber}`
    });

    // Save PhonePe Transaction ID and full checkout URL
    rider.paymentLinkId = response.id;
    rider.paymentLinkUrl = response.url;
    await rider.save();

    // Generate beautiful clean short redirect URL for WhatsApp/Frontend
    const shortUrl = `${process.env.BACKEND_URL || 'https://rideforyouev.com'}/api/payments/pay/${rider._id}`;

    res.status(200).json({ success: true, url: shortUrl, id: response.id });
  } catch (err) {
    console.error('❌ PhonePe Link Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to create PhonePe link'
    });
  }
};

// @POST /api/payments/webhook
// @desc Handle PhonePe Server-to-Server (S2S) callbacks for automatic database updates
exports.webhookHandler = async (req, res) => {
  console.log('🔔 [PHONEPE WEBHOOK] Callback received.');

  try {
    const { response } = req.body;
    if (!response) {
      console.error('❌ [PHONEPE WEBHOOK] No base64 response payload found.');
      return res.status(400).send('No response data');
    }

    // 1. Verify webhook checksum for security
    const xVerifyHeader = req.headers['x-verify'];
    if (xVerifyHeader) {
      const expectedVerify = crypto
        .createHash('sha256')
        .update(response + phonepe.SALT_KEY)
        .digest('hex') + '###' + phonepe.SALT_INDEX;

      if (xVerifyHeader !== expectedVerify) {
        console.error('❌ [PHONEPE WEBHOOK] Webhook verification signature mismatch!');
        return res.status(401).send('Unauthorized signature');
      }
      console.log('✅ [PHONEPE WEBHOOK] Signature successfully verified.');
    } else {
      console.warn('⚠️ [PHONEPE WEBHOOK] No x-verify header provided, skipping signature verification.');
    }

    // 2. Decode Base64 Payload
    const decoded = JSON.parse(Buffer.from(response, 'base64').toString('utf-8'));
    console.log('🔔 [PHONEPE WEBHOOK] Decoded payload:', JSON.stringify(decoded, null, 2));

    if (decoded.success && decoded.code === 'PAYMENT_SUCCESS') {
      const { transactionId, amount: amountInPaise } = decoded.data;
      const amount = amountInPaise / 100;

      console.log(`🔍 [PHONEPE WEBHOOK] Processing successful payment. TX ID: ${transactionId}, Amount: ${amount}`);

      // Find Rider by paymentLinkId (the PhonePe transactionId)
      const rider = await Rider.findOne({ paymentLinkId: transactionId });
      if (!rider) {
        console.error(`❌ [PHONEPE WEBHOOK] No rider found with paymentLinkId matching ${transactionId}`);
        return res.status(200).send('OK'); // Return 200 so PhonePe stops retrying
      }

      if (rider.paymentStatus === 'unpaid') {
        const nextWeek = new Date(rider.returnDate || Date.now());
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        rider.returnDate = nextWeek;
        rider.totalWeeks = (rider.totalWeeks || 0) + 1;
        rider.paymentStatus = 'paid';
        
        // Reset escalation and recovery on payment
        rider.reminderEscalationStage = 0;
        rider.isRecoveryBucket = false;

        if (rider.vehicleNumber && !rider.bikesUsed.includes(rider.vehicleNumber)) {
          rider.bikesUsed.push(rider.vehicleNumber);
        }
        
        await rider.save();

        // Create Invoice Record
        try {
          const { createInvoiceRecord } = require('../utils/invoiceHelper');
          await createInvoiceRecord(rider, amount);
        } catch (invErr) {
          console.error('⚠️ [PHONEPE WEBHOOK] Invoice helper error:', invErr.message);
        }

        console.log(`🎉 [PHONEPE WEBHOOK] Successfully updated Rider ${rider.name} to PAID`);
        
        // Send WhatsApp Confirmation
        try {
          const { sendPaymentReminder } = require('../utils/whatsapp');
          const confirmationBody = `✅ *Payment Received! - Ride For You*\n\nHello *${rider.name}*,\n\nWe have successfully received your weekly rental payment of *₹${amount}*.\n\nYour dashboard has been updated. Thank you! ⚡`;
          await sendPaymentReminder(rider.whatsappNumber, { body: confirmationBody });
        } catch (waErr) {
          console.error('⚠️ [PHONEPE WEBHOOK] WhatsApp confirmation failed:', waErr.message);
        }
      } else {
        console.log(`ℹ️ [PHONEPE WEBHOOK] Rider ${rider.name} is already marked PAID. Skipping updates.`);
      }
    } else {
      console.warn(`⚠️ [PHONEPE WEBHOOK] Payment state not successful. Code: ${decoded.code}`);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('💥 [PHONEPE WEBHOOK] CRITICAL WEBHOOK ERROR:', err);
    res.status(200).send('OK'); // Return 200 to stop retry cycle on crash
  }
};

// @GET /api/payments/config-status
// @desc Diagnostic endpoint to verify environment variables (masked)
exports.getConfigStatus = async (req, res) => {
  try {
    const mask = (val) => val ? `${val.substring(0, 4)}...${val.substring(val.length - 4)}` : 'MISSING';
    const hasValue = (val) => !!(val && val.trim());

    const status = {
      cashfree: {
        app_id_exists: hasValue(process.env.CASHFREE_APP_ID),
        secret_key_exists: hasValue(process.env.CASHFREE_SECRET_KEY),
        app_id_masked: mask(process.env.CASHFREE_APP_ID),
        mode: (process.env.CASHFREE_APP_ID || '').startsWith('TEST') ? 'SANDBOX' : 'PRODUCTION',
      },
      phonepe: {
        merchant_id_exists: hasValue(process.env.PHONEPE_MERCHANT_ID),
        salt_key_exists: hasValue(process.env.PHONEPE_SALT_KEY),
        salt_index_exists: hasValue(process.env.PHONEPE_SALT_INDEX),
        merchant_id_masked: mask(process.env.PHONEPE_MERCHANT_ID),
        mode: process.env.PHONEPE_ENV || 'production',
      },
      twilio: {
        account_sid_exists: hasValue(process.env.TWILIO_ACCOUNT_SID),
        auth_token_exists: hasValue(process.env.TWILIO_AUTH_TOKEN),
      },
      general: {
        node_env: process.env.NODE_ENV,
        frontend_url: process.env.FRONTEND_URL,
        port: process.env.PORT,
      }
    };

    res.status(200).json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/payments/pay/:riderId
// @desc Redirect clean shortened links to PhonePe long redirect URL
exports.redirectPayment = async (req, res) => {
  try {
    const { riderId } = req.params;
    const rider = await Rider.findById(riderId);
    
    if (rider && rider.paymentLinkUrl) {
      console.log(`📡 Redirecting rider ${rider.name} to PhonePe checkout URL...`);
      return res.redirect(rider.paymentLinkUrl);
    }
    
    res.status(404).send('<h1>Payment Link Expired</h1><p>This payment link has expired or is invalid. Please contact support or request a new checkout link.</p>');
  } catch (err) {
    console.error('💥 [REDIRECT ERROR] Failed to redirect payment:', err);
    res.status(500).send('Internal Server Error');
  }
};
