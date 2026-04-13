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

    // Prepare template variables (as per user's snippet example)
    // For now, using placeholders for date and time
    const variables = {
      "1": new Date().toLocaleDateString(),
      "2": new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Note: Generating QR code image but Twilio Content API often uses SID for media
    // or public URLs. For now, we simulate the sending as requested.
    await sendPaymentReminder(rider.whatsappNumber, variables);

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
