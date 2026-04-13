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

    // Prepare template variables
    // Mapping for HXb5b62575e6e4ff6129ad7c8efe1f983e:
    // 1: Rider Name
    // 2: Return Date (formatted)
    const variables = {
      "1": rider.name,
      "2": new Date(rider.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    };

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
