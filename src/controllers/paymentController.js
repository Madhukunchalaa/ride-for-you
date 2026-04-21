const crypto = require('crypto');
const Rider = require('../models/Rider');
const razorpay = require('../config/razorpay');

// @POST /api/payments/create-order
// @desc Create a Razorpay order for a rider's weekly payment
exports.createOrder = async (req, res) => {
  try {
    const { riderId, amount } = req.body;

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    const finalAmount = rider.whatsappNumber === '7095682464' ? 1 : (amount || 2000);

    const options = {
      amount: finalAmount * 100, // amount in the smallest currency unit (paise for INR)
      currency: "INR",
      receipt: `receipt_rider_${riderId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order
    });
  } catch (err) {
    console.error('Razorpay Order Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/payments/verify
// @desc Verify Razorpay payment signature
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, riderId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment is verified
      const rider = await Rider.findById(riderId);
      if (rider && rider.paymentStatus === 'unpaid') {
        const nextWeek = new Date(rider.returnDate || Date.now());
        nextWeek.setDate(nextWeek.getDate() + 7);
        rider.returnDate = nextWeek;
        rider.totalWeeks = (rider.totalWeeks || 0) + 1;
        rider.paymentStatus = 'paid';
        
        if (!rider.bikesUsed.includes(rider.vehicleNumber)) {
          rider.bikesUsed.push(rider.vehicleNumber);
        }
        await rider.save();

        // Create Invoice Record
        const { createInvoiceRecord } = require('../utils/invoiceHelper');
        await createInvoiceRecord(rider, req.body.amount || 2000);
      }

      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/payments/create-link
// @desc Create a Cashfree Payment Link for WhatsApp
const axios = require('axios');
const cashfreeConfig = require('../config/cashfree');

exports.createPaymentLink = async (req, res) => {
  try {
    const { riderId, amount } = req.body;
    const rider = await Rider.findById(riderId);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });
    
    const amountVal = amount || 2000;
    const uniqueLinkId = `ride_${riderId}_${Date.now()}`;
    
    const payload = {
      link_id: uniqueLinkId,
      link_amount: amountVal,
      link_currency: "INR",
      link_purpose: `Weekly Rental - ${rider.vehicleNumber}`,
      customer_details: {
        customer_phone: rider.whatsappNumber,
        customer_name: rider.name
      },
      link_notify: { send_sms: false, send_email: false },
      link_meta: {
        return_url: `${process.env.FRONTEND_URL}/`,
        notify_url: `${process.env.FRONTEND_URL}/api/payments/webhook`
      }
    };

    const response = await axios.post(`${cashfreeConfig.baseUrl}/links`, payload, {
      headers: {
        'x-client-id': cashfreeConfig.clientId,
        'x-client-secret': cashfreeConfig.clientSecret,
        'x-api-version': cashfreeConfig.apiVersion,
        'Content-Type': 'application/json'
      }
    });

    const paymentUrl = response.data.link_url;

    // Save ID
    rider.paymentLinkId = uniqueLinkId;
    await rider.save();

    res.status(200).json({ success: true, url: paymentUrl, id: uniqueLinkId });
  } catch (err) {
    const errorData = err.response ? err.response.data : null;
    let errorMessage = 'Failed to create payment link';
    
    if (errorData) {
      if (errorData.message === 'Authentication Failed') {
        errorMessage = 'Cashfree Authentication Failed: Please check your API credentials.';
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } else {
      errorMessage = err.message;
    }

    console.error('❌ Cashfree Link Error:', {
      message: err.message,
      data: errorData,
      stack: err.stack
    });

    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      details: errorData 
    });
  }
};
const { sendPaymentReminder } = require('../utils/whatsapp');

// @POST /api/payments/webhook
// @desc Handle Cashfree Webhooks for automatic database updates
exports.webhookHandler = async (req, res) => {
  console.log('🔔 [WEBHOOK] Received Payload:', JSON.stringify(req.body, null, 2));

  try {
    const { type, data } = req.body;
    if (!data) {
      console.error('❌ [WEBHOOK] No data object in payload');
      return res.status(200).send('OK');
    }

    // 1. Determine Payment Success (multiple strategies)
    const linkStatus = data.link?.link_status;
    const orderStatus = data.order?.order_status;
    const paymentStatus = data.payment?.payment_status;

    const isSuccess = 
      linkStatus === 'PAID' || 
      linkStatus === 'SUCCESS' || 
      orderStatus === 'PAID' || 
      paymentStatus === 'SUCCESS';

    console.log(`🔍 [WEBHOOK] Status Check: Link=${linkStatus}, Order=${orderStatus}, Payment=${paymentStatus} -> Success=${isSuccess}`);

    if (isSuccess) {
      // 2. Identify the Rider (Order ID or Link ID or Order Tags)
      const linkId = data.link?.link_id || 
                     data.order?.order_tags?.link_id || 
                     data.order?.order_id;
                     
      const amount = data.link?.link_amount_paid || 
                     data.payment?.payment_amount || 
                     data.order?.order_amount;
                     
      const phone = data.customer_details?.customer_phone;

      console.log(`🔍 [WEBHOOK] Identifiers - LinkID: ${linkId}, Amount: ${amount}, Phone: ${phone}`);

      if (!linkId && !phone) {
        console.error('❌ [WEBHOOK] Could not identify rider (No LinkID or Phone)');
        return res.status(200).send('OK');
      }

      let rider = null;

      // Strategy A: By Link ID
      if (linkId && linkId.includes('_')) {
        const parts = linkId.split('_');
        const possibleId = parts[1]; // ride_{riderId}_{timestamp}
        if (possibleId && possibleId.length === 24) {
          rider = await Rider.findById(possibleId);
          if (rider) console.log(`✅ [WEBHOOK] Found Rider by LinkID: ${rider.name}`);
        }
      }

      // Strategy B: By Phone Number (fallback)
      if (!rider && phone) {
        // Clean phone number for matching
        const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
        rider = await Rider.findOne({ whatsappNumber: { $regex: cleanPhone } });
        if (rider) console.log(`✅ [WEBHOOK] Found Rider by Phone Fallback: ${rider.name}`);
      }

      if (rider) {
        // Update Rider Record
        rider.lastWebhookData = req.body; // Log for debugging

        if (rider.paymentStatus === 'unpaid') {
          const nextWeek = new Date(rider.returnDate || Date.now());
          nextWeek.setDate(nextWeek.getDate() + 7);
          
          rider.returnDate = nextWeek;
          rider.totalWeeks = (rider.totalWeeks || 0) + 1;
          rider.paymentStatus = 'paid';
          
          if (rider.vehicleNumber && !rider.bikesUsed.includes(rider.vehicleNumber)) {
            rider.bikesUsed.push(rider.vehicleNumber);
          }
          
          await rider.save();

          // Create Invoice Record
          try {
            const { createInvoiceRecord } = require('../utils/invoiceHelper');
            await createInvoiceRecord(rider, amount || 2000);
          } catch (invErr) {
            console.error('⚠️ [WEBHOOK] Invoice helper error:', invErr.message);
          }

          console.log(`🎉 [WEBHOOK] Successfully updated Rider ${rider.name} to PAID`);
          
          // Send WhatsApp Confirmation
          try {
            const { sendPaymentReminder } = require('../utils/whatsapp');
            const confirmationBody = `✅ *Payment Received! - Ride For You*\n\nHello *${rider.name}*,\n\nWe have successfully received your weekly rental payment of *₹${amount || 2000}*.\n\nYour dashboard has been updated. Thank you! ⚡`;
            await sendPaymentReminder(rider.whatsappNumber, { body: confirmationBody });
          } catch (waErr) {
            console.error('⚠️ [WEBHOOK] WhatsApp confirmation failed:', waErr.message);
          }
        } else {
          console.log(`ℹ️ [WEBHOOK] Rider ${rider.name} was already marked as PAID`);
          await rider.save(); // Still update lastWebhookData
        }
      } else {
        console.error('❌ [WEBHOOK] Rider not found in database for this payment');
      }
    } else {
      console.log('ℹ️ [WEBHOOK] Skipping non-success event');
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('💥 [WEBHOOK] CRITICAL ERROR:', err);
    res.status(200).send('OK'); // Always 200 to satisfy Cashfree
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
      razorpay: {
        key_id_exists: hasValue(process.env.RAZORPAY_KEY_ID),
        key_secret_exists: hasValue(process.env.RAZORPAY_KEY_SECRET),
        key_id_masked: mask(process.env.RAZORPAY_KEY_ID),
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
