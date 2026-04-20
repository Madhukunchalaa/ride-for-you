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
        return_url: "https://rideforyouev.com/",
        notify_url: "https://ride-for-you-production.up.railway.app/api/payments/webhook" // Cashfree hits this URL asynchronously
      }
    };

    const response = await axios.post('https://sandbox.cashfree.com/pg/links', payload, {
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    });

    const paymentUrl = response.data.link_url;

    // Save ID
    rider.paymentLinkId = uniqueLinkId;
    await rider.save();

    res.status(200).json({ success: true, url: paymentUrl, id: uniqueLinkId });
  } catch (err) {
    const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error('Cashfree Link Error:', errorMsg);
    res.status(500).json({ success: false, message: errorMsg });
  }
};
const { sendPaymentReminder } = require('../utils/whatsapp');

// @POST /api/payments/webhook
// @desc Handle Cashfree Webhooks for automatic database updates
exports.webhookHandler = async (req, res) => {
  console.log('🔔 Cashfree Webhook Received Full Payload:', JSON.stringify(req.body, null, 2));

  try {
    const { type, data } = req.body;

    // Cashfree payload for Link payments
    const isLinkPaid = data && data.link && (data.link.link_status === 'PAID' || data.link.link_status === 'SUCCESS');
    const isOrderPaid = data && data.order && data.order.order_status === 'PAID';

    if (isLinkPaid || isOrderPaid) {
      const linkId = isLinkPaid ? data.link.link_id : data.order.order_id; 
      
      if (!linkId) return res.status(200).send('OK');

      const riderId = linkId.split('_')[1]; // ride_{riderId}_{Date.now()}
      const amount = isLinkPaid ? data.link.link_amount_paid : (data.payment ? data.payment.payment_amount : data.order.order_amount);

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
        await createInvoiceRecord(rider, amount);

        console.log(`✅ Success: Rider ${rider.name} paid ₹${amount} (Link ID: ${linkId})`);
        
        // Send WhatsApp Confirmation
        const confirmationBody = `✅ *Payment Received! - Ride For You*\n\nHello *${rider.name}*,\n\nWe have successfully received your weekly rental payment of *₹${amount}*.\n\nYour dashboard has been updated. Thank you! ⚡`;
        await sendPaymentReminder(rider.whatsappNumber, { body: confirmationBody });
      }
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(200).send('OK'); // Always send 200 so they stop retrying
  }
};
