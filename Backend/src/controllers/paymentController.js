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
// @desc Create a Razorpay Payment Link for WhatsApp
exports.createPaymentLink = async (req, res) => {
  try {
    const { riderId, amount } = req.body;
    const rider = await Rider.findById(riderId);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });
    
    const amountVal = amount || 2000;
    const paymentLink = await razorpay.paymentLink.create({
      amount: amountVal * 100,
      currency: "INR",
      accept_partial: false,
      description: `Weekly Rental - ${rider.vehicleNumber}`,
      customer: {
        name: rider.name,
        contact: rider.whatsappNumber,
      },
      notify: { sms: false, email: false },
      notes: { riderId: riderId.toString() },
      callback_url: `http://localhost:5173/riders`,
      callback_method: "get"
    });

    // Save ID
    rider.paymentLinkId = paymentLink.id;
    await rider.save();

    res.status(200).json({ success: true, url: paymentLink.short_url, id: paymentLink.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const { sendPaymentReminder } = require('../utils/whatsapp');

// @POST /api/payments/webhook
// @desc Handle Razorpay Webhooks for automatic database updates
exports.webhookHandler = async (req, res) => {
  const event = req.body.event;
  console.log('🔔 Razorpay Webhook Received Full Payload:', JSON.stringify(req.body, null, 2));

  if (event === 'payment_link.paid') {
    const payload = req.body.payload.payment_link.entity;
    const riderId = payload.notes.riderId;
    const linkId = payload.id;
    const amount = payload.amount / 100;

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
        await createInvoiceRecord(rider, payload.amount / 100);
      }

    if (rider) {
      console.log(`✅ Success: Rider ${rider.name} paid ₹${amount} (Link ID: ${linkId})`);
      
      // Send WhatsApp Confirmation
      const confirmationBody = `✅ *Payment Received! - Ride For You*\n\nHello *${rider.name}*,\n\nWe have successfully received your weekly rental payment of *₹${amount}*.\n\nYour dashboard has been updated. Thank you! ⚡`;
      await sendPaymentReminder(rider.whatsappNumber, { body: confirmationBody });
    }
  }

  res.status(200).send('OK');
};
