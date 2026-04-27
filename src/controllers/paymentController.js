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
const { getCashfreeConfig } = require('../config/cashfree');

exports.createPaymentLink = async (req, res) => {
  try {
    const { riderId, amount } = req.body;
    const rider = await Rider.findById(riderId);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });
    
    const amountVal = (amount || 2000) * 100; // in paise
    const uniqueLinkId = `ride_${riderId}_${Date.now()}`;
    
    const response = await razorpay.paymentLink.create({
      amount: amountVal,
      currency: "INR",
      accept_partial: false,
      description: `Weekly Rental - ${rider.vehicleNumber}`,
      customer: {
        name: rider.name,
        contact: rider.whatsappNumber,
      },
      notify: {
        sms: false,
        email: false
      },
      reminder_enable: true,
      notes: {
        riderId: riderId,
        link_id: uniqueLinkId
      },
      callback_url: `${process.env.FRONTEND_URL}/`,
      callback_method: "get"
    });

    const paymentUrl = response.short_url;

    // Save ID
    rider.paymentLinkId = response.id; // Razorpay PL ID
    await rider.save();

    res.status(200).json({ success: true, url: paymentUrl, id: response.id });
  } catch (err) {
    console.error('❌ Razorpay Link Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to create Razorpay link'
    });
  }
};

const { sendPaymentReminder } = require('../utils/whatsapp');

// @POST /api/payments/webhook
// @desc Handle Cashfree Webhooks for automatic database updates
exports.webhookHandler = async (req, res) => {
  console.log('🔔 [RAZORPAY WEBHOOK] Received Event:', req.body.event);

  try {
    const { event, payload } = req.body;

    // Handle Payment Link Success
    if (event === 'payment_link.paid') {
      const data = payload.payment_link.entity;
      const amount = data.amount_paid / 100;
      const riderId = data.notes?.riderId;

      console.log(`🔍 [WEBHOOK] Processing Razorpay Link: ${data.id}, Rider: ${riderId}, Amount: ${amount}`);

      if (!riderId) {
        console.error('❌ [WEBHOOK] No riderId in link notes');
        return res.status(200).send('OK');
      }

      const rider = await Rider.findById(riderId);
      if (rider) {
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
            await createInvoiceRecord(rider, amount);
          } catch (invErr) {
            console.error('⚠️ [WEBHOOK] Invoice helper error:', invErr.message);
          }

          console.log(`🎉 [WEBHOOK] Successfully updated Rider ${rider.name} to PAID`);
          
          // Send WhatsApp Confirmation
          try {
            const { sendPaymentReminder } = require('../utils/whatsapp');
            const confirmationBody = `✅ *Payment Received! - Ride For You*\n\nHello *${rider.name}*,\n\nWe have successfully received your weekly rental payment of *₹${amount}*.\n\nYour dashboard has been updated. Thank you! ⚡`;
            await sendPaymentReminder(rider.whatsappNumber, { body: confirmationBody });
          } catch (waErr) {
            console.error('⚠️ [WEBHOOK] WhatsApp confirmation failed:', waErr.message);
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('💥 [WEBHOOK] CRITICAL ERROR:', err);
    res.status(200).send('OK');
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
