const Rider = require('../models/Rider');
const { sendPaymentReminder } = require('../utils/whatsapp');
const { generateUPIQRCode } = require('../utils/qrGenerator');

// @POST /api/riders/:id/send-reminder
// @desc Send a manual payment reminder via WhatsApp
exports.sendReminder = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    // Prepare session message body (requires user to send 'hi' first)
    // Prepare dynamic payment link
    const amountVal = rider.whatsappNumber === '7095682464' ? 1 : 2000;
    
    // Call our internal create-link logic (or similar)
    // For simplicity in this demo, we'll assume a short_url is generated
    const paymentLink = `https://rzp.io/l/ride-for-you-test`; // In real app, call createPaymentLink()

    const returnDate = new Date(rider.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const body = `💳 *Payment Reminder - Ride For You*\n\nHello *${rider.name}*,\n\nYour rental for vehicle *${rider.vehicleNumber}* is due on *${returnDate}*.\n\nPlease pay your weekly rent via the link below. Once paid, your dashboard will update automatically! ⚡\n\n🔗 *Pay Now:* ${paymentLink}`;

    await sendPaymentReminder(rider.whatsappNumber, { body });

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
