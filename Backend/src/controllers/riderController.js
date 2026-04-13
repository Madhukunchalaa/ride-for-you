const Rider = require('../models/Rider');
const { sendPaymentReminder } = require('../utils/whatsapp');
const { generateUPIQRCode } = require('../utils/qrGenerator');
const razorpay = require('../config/razorpay');

// @POST /api/riders/:id/send-reminder
// @desc Send a manual payment reminder via WhatsApp
exports.sendReminder = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    const amountVal = rider.whatsappNumber === '7095682464' ? 1 : 2000;

    // 1. Create REAL Razorpay Payment Link
    const paymentLinkObj = await razorpay.paymentLink.create({
      amount: amountVal * 100, // in paise
      currency: "INR",
      accept_partial: false,
      description: `Weekly Rental - ${rider.vehicleNumber} (Rider: ${rider.name})`,
      customer: {
        name: rider.name,
        contact: rider.whatsappNumber,
      },
      notify: { sms: false, email: false },
      reminder_enable: true,
      notes: { riderId: rider._id.toString() },
      callback_url: `http://localhost:5173/riders`,
      callback_method: "get"
    });

    // 2. Store Payment Link ID in Database
    rider.paymentLinkId = paymentLinkObj.id;
    await rider.save();

    // 3. Prepare QR and Message
    const paymentLink = paymentLinkObj.short_url;
    // Generate valid QR from short_url
    const mediaUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLink)}`;
    
    const returnDate = new Date(rider.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const body = `💳 *Payment Reminder - Ride For You*\n\nHello *${rider.name}*,\n\nYour rental payment for vehicle *${rider.vehicleNumber}* is due on *${returnDate}*.\n\n🔗 *Pay Now:* ${paymentLink}\n\nOr scan the QR code below to pay easily. Once paid, your dashboard will update automatically! ⚡`;

    await sendPaymentReminder(rider.whatsappNumber, { body, mediaUrl });

    res.status(200).json({
      success: true,
      message: `Reminder sent to ${rider.name}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ... existing functions ...

// @POST /api/riders
// @desc Add a new rider
exports.addRider = async (req, res) => {
  try {
    const { name, whatsappNumber, riderStatus, vehicleNumber, deployDate, returnDate } = req.body;

    if (!name || !whatsappNumber || !vehicleNumber || !deployDate || !returnDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const rider = await Rider.create({
      name,
      whatsappNumber,
      riderStatus: riderStatus || 'active',
      vehicleNumber,
      deployDate,
      returnDate
    });

    res.status(201).json({
      success: true,
      data: rider
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/riders
// @desc Get all riders
exports.getRiders = async (req, res) => {
  try {
    const riders = await Rider.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: riders.length,
      data: riders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const rider = await Rider.findByIdAndUpdate(req.params.id, { paymentStatus }, { new: true });
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });
    res.status(200).json({ success: true, rider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
