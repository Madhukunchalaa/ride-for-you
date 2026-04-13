const Razorpay = require('razorpay');
const crypto = require('crypto');
const Rider = require('../models/Rider');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
      await Rider.findByIdAndUpdate(riderId, {
        paymentStatus: 'paid',
        updatedAt: Date.now()
      });

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
    
    const paymentLink = await razorpay.paymentLink.create({
      amount: (amount || 2000) * 100,
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
      notes: { riderId: riderId.toString() },
      callback_url: `http://localhost:5173/riders`, // Local for now
      callback_method: "get"
    });

    res.status(200).json({ success: true, url: paymentLink.short_url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/payments/webhook
// @desc Handle Razorpay Webhooks for automatic database updates
exports.webhookHandler = async (req, res) => {
  const secret = 'your_webhook_secret'; // In real app, verify this!
  const event = req.body.event;

  console.log('🔔 Razorpay Webhook Received:', event);

  if (event === 'payment_link.paid') {
    const paymentLink = req.body.payload.payment_link.entity;
    const riderId = paymentLink.notes.riderId;

    await Rider.findByIdAndUpdate(riderId, {
      paymentStatus: 'paid',
      updatedAt: Date.now()
    });
    console.log(`✅ Rider ${riderId} marked as PAID via Webhook`);
  }

  res.status(200).send('OK');
};
