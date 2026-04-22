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

    if (!cashfreeConfig.isConfigured) {
      console.error('❌ Skipping Cashfree link creation: Keys are missing.');
      return res.status(500).json({ 
        success: false, 
        message: 'Cashfree API keys are missing in the server environment. Please check your Railway Dashboard.' 
      });
    }

    const amountVal = rider.whatsappNumber === '7095682464' ? 1 : 2000;
    const uniqueLinkId = `ride_${rider._id}_${Date.now()}`;

    console.log(`📡 Sending Cashfree Request:`);
    console.log(`   - URL: ${cashfreeConfig.baseUrl}/links`);
    console.log(`   - AppID: ${cashfreeConfig.clientId.substring(0, 4)}...${cashfreeConfig.clientId.slice(-4)} (Len: ${cashfreeConfig.clientId.length})`);
    console.log(`   - Secret: ${cashfreeConfig.clientSecret.substring(0, 4)}...${cashfreeConfig.clientSecret.slice(-4)} (Len: ${cashfreeConfig.clientSecret.length})`);
    
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

    console.log(`✅ Cashfree Response Status: ${response.status}`);
    const paymentLink = response.data && response.data.link_url ? response.data.link_url : null;

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
// @desc Add a new rider (with Reactivation and Vehicle Lock)
exports.addRider = async (req, res) => {
  try {
    const { 
      name, whatsappNumber, riderStatus, vehicleNumber, deployDate, returnDate,
      autoReminderEnabled, autoReminderTime 
    } = req.body;

    if (!name || !whatsappNumber || !vehicleNumber || !deployDate || !returnDate) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // 1. Vehicle Lock: Check if bike is already with another ACTIVE rider
    const activeBike = await Rider.findOne({ 
      vehicleNumber: vehicleNumber.trim().toUpperCase(), 
      riderStatus: 'active' 
    });
    if (activeBike) {
      return res.status(400).json({ 
        success: false, 
        message: `Vehicle ${vehicleNumber} is currently assigned to active rider: ${activeBike.name}` 
      });
    }

    // 2. Reactivation Logic: Check if rider already exists
    let rider = await Rider.findOne({ whatsappNumber: whatsappNumber.trim() });

    if (rider) {
      if (rider.riderStatus === 'active') {
        return res.status(400).json({ 
          success: false, 
          message: `A rider with phone ${whatsappNumber} is already active in your fleet.` 
        });
      }

      // Reactivate Past Rider
      console.log(`🔄 Reactivating past rider: ${rider.name}`);
      
      // Store old bike in history if it's different
      if (rider.vehicleNumber && rider.vehicleNumber !== vehicleNumber.toUpperCase()) {
        if (!rider.bikesUsed.includes(rider.vehicleNumber)) {
          rider.bikesUsed.push(rider.vehicleNumber);
        }
      }

      rider.name = name;
      rider.vehicleNumber = vehicleNumber.toUpperCase();
      rider.riderStatus = 'active';
      rider.deployDate = deployDate;
      rider.returnDate = returnDate;
      rider.paymentStatus = 'unpaid';
      rider.autoReminderEnabled = autoReminderEnabled !== undefined ? autoReminderEnabled : true;
      rider.autoReminderTime = autoReminderTime || '10:00';
      rider.reminderEscalationStage = 0;
      rider.isRecoveryBucket = false;
      
      await rider.save();
      
      return res.status(200).json({
        success: true,
        message: 'Past rider reactivated successfully',
        data: rider
      });
    }

    // 3. Create New Rider
    const newRider = await Rider.create({
      name,
      whatsappNumber,
      riderStatus: riderStatus || 'active',
      vehicleNumber: vehicleNumber.toUpperCase(),
      deployDate,
      returnDate,
      autoReminderEnabled: autoReminderEnabled !== undefined ? autoReminderEnabled : true,
      autoReminderTime: autoReminderTime || '10:00',
      bikesUsed: [vehicleNumber.toUpperCase()]
    });

    res.status(201).json({
      success: true,
      data: newRider
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/riders/:id
// @desc Update rider details
exports.updateRider = async (req, res) => {
  try {
    const { name, whatsappNumber, vehicleNumber, deployDate, returnDate, autoReminderEnabled, autoReminderTime } = req.body;
    
    const rider = await Rider.findById(req.params.id);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    // Vehicle Lock check if vehicle is changing
    if (vehicleNumber && vehicleNumber.toUpperCase() !== rider.vehicleNumber) {
      const activeBike = await Rider.findOne({ 
        _id: { $ne: rider._id },
        vehicleNumber: vehicleNumber.trim().toUpperCase(), 
        riderStatus: 'active' 
      });
      if (activeBike) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot switch to ${vehicleNumber}. It is already assigned to: ${activeBike.name}` 
        });
      }
      
      // Store old bike in history
      if (!rider.bikesUsed.includes(rider.vehicleNumber)) {
        rider.bikesUsed.push(rider.vehicleNumber);
      }
    }

    // Update fields
    if (name) rider.name = name;
    if (whatsappNumber) rider.whatsappNumber = whatsappNumber;
    if (vehicleNumber) rider.vehicleNumber = vehicleNumber.toUpperCase();
    if (deployDate) rider.deployDate = deployDate;
    if (returnDate) rider.returnDate = returnDate;
    if (autoReminderEnabled !== undefined) rider.autoReminderEnabled = autoReminderEnabled;
    if (autoReminderTime) rider.autoReminderTime = autoReminderTime;

    await rider.save();
    res.status(200).json({ success: true, data: rider });
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
    const { paymentStatus, riderStatus, isRecoveryBucket } = req.body;
    const rider = await Rider.findById(req.params.id);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    // Handle payment status changes
    if (paymentStatus) {
      if (paymentStatus === 'paid' && rider.paymentStatus === 'unpaid') {
        const nextWeek = new Date(rider.returnDate || Date.now());
        nextWeek.setDate(nextWeek.getDate() + 7);
        rider.returnDate = nextWeek;
        rider.totalWeeks = (rider.totalWeeks || 0) + 1;
        
        // Reset escalation and recovery on payment
        rider.reminderEscalationStage = 0;
        rider.isRecoveryBucket = false;

        if (!rider.bikesUsed.includes(rider.vehicleNumber)) {
          rider.bikesUsed.push(rider.vehicleNumber);
        }

        const { createInvoiceRecord } = require('../utils/invoiceHelper');
        await createInvoiceRecord(rider, req.body.amount || 2000);
      }
      rider.paymentStatus = paymentStatus;
    }

    // Handle recovery bucket manual toggle
    if (isRecoveryBucket !== undefined) {
      rider.isRecoveryBucket = isRecoveryBucket;
      if (isRecoveryBucket) {
        rider.reminderEscalationStage = 3; // Max stage if manually moved
      }
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
