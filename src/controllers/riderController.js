const Rider = require('../models/Rider');
const { sendPaymentReminder } = require('../utils/whatsapp');
const { generateUPIQRCode } = require('../utils/qrGenerator');
const razorpay = require('../config/razorpay');

// @POST /api/riders/:id/send-reminder
// @desc Send a manual payment reminder via WhatsApp
const axios = require('axios');
const cashfreeConfig = require('../config/cashfree');
exports.sendReminder = async (req, res) => {
  console.log(`📩 Manual Reminder Request for Rider ID: ${req.params.id}`);
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      console.warn('❌ Rider not found for ID:', req.params.id);
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    if (!rider.whatsappNumber) {
      console.warn('❌ Rider has no WhatsApp number:', rider.name);
      return res.status(400).json({ success: false, message: 'Rider has no WhatsApp number' });
    }

    const amountVal = rider.whatsappNumber === '7095682464' ? 1 : 2000;
    const uniqueLinkId = `ride_${rider._id}_${Date.now()}`;

    console.log(`🔗 Requesting Cashfree for ${rider.name} (Amount: ${amountVal}, ID: ${uniqueLinkId})`);
    
    // 1. Create REAL Cashfree Payment Link
    const payload = {
      link_id: uniqueLinkId,
      link_amount: amountVal,
      link_currency: "INR",
      link_purpose: `Weekly Rental - ${rider.vehicleNumber} (Rider: ${rider.name})`,
      customer_details: {
        customer_phone: rider.whatsappNumber,
        customer_name: rider.name
      },
      link_notify: { send_sms: false, send_email: false },
      link_meta: {
        return_url: `${process.env.FRONTEND_URL || 'https://rideforyouev.com'}/`,
        notify_url: `${process.env.FRONTEND_URL || 'https://ride-for-you-production.up.railway.app'}/api/payments/webhook`
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

    console.log(`✅ Cashfree Response:`, response.data && response.data.link_url ? 'Link Received' : 'No Link URL');
    const paymentLink = response.data.link_url;

    if (!paymentLink) {
       console.error('❌ Cashfree Link Missing in Response:', response.data);
       throw new Error('Cashfree link generation failed: No URL returned');
    }

    // 2. Store Payment Link ID in Database
    rider.paymentLinkId = uniqueLinkId;
    await rider.save();

    // 3. Prepare QR and Message
    console.log(`🖼️ Generating QR for: ${paymentLink}`);
    const mediaUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLink)}`;
    
    const returnDate = rider.returnDate ? new Date(rider.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A';
    const body = `💳 *Payment Reminder - Ride For You*\n\nHello *${rider.name}*,\n\nYour rental payment for vehicle *${rider.vehicleNumber}* is due on *${returnDate}*.\n\n🔗 *Pay Now:* ${paymentLink}\n\nOr scan the QR code below to pay easily. Once paid, your dashboard will update automatically! ⚡`;

    console.log(`📲 Sending WhatsApp to ${rider.whatsappNumber}...`);
    await sendPaymentReminder(rider.whatsappNumber, { body, mediaUrl });
    console.log(`✨ Successfully sent reminder to ${rider.name}`);

    res.status(200).json({
      success: true,
      message: `Reminder sent to ${rider.name}`
    });
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

    console.error('❌ Cashfree Link Reminder Error:', {
      message: err.message,
      data: errorData
    });
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      details: errorData 
    });
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
    const { paymentStatus, riderStatus } = req.body;
    const rider = await Rider.findById(req.params.id);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    // Handle payment status changes
    if (paymentStatus) {
      if (paymentStatus === 'paid' && rider.paymentStatus === 'unpaid') {
        const nextWeek = new Date(rider.returnDate || Date.now());
        nextWeek.setDate(nextWeek.getDate() + 7);
        rider.returnDate = nextWeek;
        rider.totalWeeks = (rider.totalWeeks || 0) + 1;
        
        if (!rider.bikesUsed.includes(rider.vehicleNumber)) {
          rider.bikesUsed.push(rider.vehicleNumber);
        }

        const { createInvoiceRecord } = require('../utils/invoiceHelper');
        await createInvoiceRecord(rider, req.body.amount || 2000);
      }
      rider.paymentStatus = paymentStatus;
    }

    // Handle soft deletion / archiving
    if (riderStatus) {
      rider.riderStatus = riderStatus;
    }

    await rider.save();
    
    res.status(200).json({ success: true, rider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/riders/:id
exports.deleteRider = async (req, res) => {
  try {
    const rider = await Rider.findByIdAndDelete(req.params.id);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });
    res.status(200).json({ success: true, message: 'Rider deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const Invoice = require('../models/Invoice');

// @GET /api/riders/:id/details
exports.getRiderDetails = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    // Fetch invoices linked to this rider
    const invoices = await Invoice.find({ riderId: req.params.id }).sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: {
        ...rider.toObject(),
        invoices
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/riders/:id/complaints
exports.addComplaint = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Complaint text is required' });

    const rider = await Rider.findById(req.params.id);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    rider.complaints.push({ text });
    await rider.save();

    res.status(200).json({ success: true, message: 'Complaint added' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
