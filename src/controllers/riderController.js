const Rider = require('../models/Rider');
const { sendPaymentReminder } = require('../utils/whatsapp');
const { generateUPIQRCode } = require('../utils/qrGenerator');
const phonepe = require('../config/phonepe');
const razorpay = require('../config/razorpay');

const SystemConfig = require('../models/SystemConfig');
const { createInvoiceRecord } = require('../utils/invoiceHelper');

// @POST /api/riders/:id/send-reminder
// @desc Send a manual payment reminder via WhatsApp
const axios = require('axios');
const { getCashfreeConfig } = require('../config/cashfree');
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

    // Send QR-based WhatsApp reminder (same as automated reminder)
    const { sendAutomatedPaymentLink } = require('../utils/paymentReminders');
    const success = await sendAutomatedPaymentLink(rider, 'normal');

    if (!success) {
      return res.status(500).json({ success: false, message: 'Failed to send WhatsApp reminder. Check server logs.' });
    }

    res.status(200).json({
      success: true,
      message: `QR Payment reminder sent to ${rider.name}`
    });

  } catch (err) {
    console.error('❌ Manual Reminder Error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: err.message
    });

  }
};

// ... existing functions ...

// @POST /api/riders
// @desc Add a new rider (with Reactivation and Vehicle Lock)
exports.addRider = async (req, res) => {
  try {
    const { 
      name, whatsappNumber, email, riderStatus, vehicleNumber, deployDate, returnDate,
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

      const initialWeeks = (deployDate && returnDate)
        ? Math.max(1, Math.round((new Date(returnDate) - new Date(deployDate)) / (1000 * 60 * 60 * 24 * 7)))
        : 1;

      rider.name = name;
      rider.email = email;
      rider.vehicleNumber = vehicleNumber.toUpperCase();
      rider.riderStatus = 'active';
      rider.deployDate = deployDate;
      rider.returnDate = returnDate;
      // rider.totalWeeks = initialWeeks; // Fix 6: Remove overwriting totalWeeks on reactivation
      rider.paymentStatus = 'unpaid';
      rider.autoReminderEnabled = autoReminderEnabled !== undefined ? autoReminderEnabled : true;
      rider.autoReminderTime = autoReminderTime || '00:00';
      rider.reminderEscalationStage = 0;
      rider.isRecoveryBucket = false;
      rider.securityDeposit = Number(req.body.securityDeposit) || 0;
      
      if (req.body.rentalRate) {
        rider.rentalRate = Number(req.body.rentalRate);
      } else {
        const config = await SystemConfig.findOne({ key: 'WEEKLY_RENTAL_AMOUNT' });
        rider.rentalRate = config ? Number(config.value) : 2000;
      }

      await rider.save();
      
      // The payment link will be sent automatically by the cron job on the return date.
      
      return res.status(200).json({
        success: true,
        message: 'Past rider reactivated successfully',
        data: rider
      });
    }

    const initialWeeks = (deployDate && returnDate)
      ? Math.max(1, Math.round((new Date(returnDate) - new Date(deployDate)) / (1000 * 60 * 60 * 24 * 7)))
      : 1;

    // 3. Create New Rider
    const newRider = new Rider({
      name,
      whatsappNumber,
      email,
      riderStatus: riderStatus || 'active',
      vehicleNumber: vehicleNumber.toUpperCase(),
      deployDate,
      returnDate,
      totalWeeks: 0, // Fix 5: New riders have paid 0 weeks at creation
      autoReminderEnabled: autoReminderEnabled !== undefined ? autoReminderEnabled : true,
      autoReminderTime: autoReminderTime || '00:00',
      bikesUsed: [vehicleNumber.toUpperCase()],
      securityDeposit: req.body.securityDeposit !== undefined ? Number(req.body.securityDeposit) : 0
    });

    if (req.body.rentalRate !== undefined) {
      newRider.rentalRate = Number(req.body.rentalRate);
    } else {
      const config = await SystemConfig.findOne({ key: 'WEEKLY_RENTAL_AMOUNT' });
      newRider.rentalRate = config ? Number(config.value) : 2000;
    }

    if (riderStatus === 'recovery') {
      newRider.isRecoveryBucket = true;
      newRider.reminderEscalationStage = 3;
    }

    await newRider.save();

    // The payment link will be sent automatically by the cron job on the return date.

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
    const { name, email, whatsappNumber, vehicleNumber, deployDate, returnDate, autoReminderEnabled, autoReminderTime, riderStatus } = req.body;

    
    const rider = await Rider.findById(req.params.id);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    const wasInRecovery = rider.isRecoveryBucket;
    const wasInPoliceRecovery = rider.isPoliceRecovery;

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
    if (email) rider.email = email;
    if (whatsappNumber) rider.whatsappNumber = whatsappNumber;
    if (vehicleNumber) rider.vehicleNumber = vehicleNumber.toUpperCase();
    if (deployDate) rider.deployDate = deployDate;
    if (returnDate) rider.returnDate = returnDate;
    if (autoReminderEnabled !== undefined) rider.autoReminderEnabled = autoReminderEnabled;
    if (autoReminderTime) rider.autoReminderTime = autoReminderTime;
    else if (!rider.autoReminderTime) rider.autoReminderTime = '00:00';
    if (riderStatus) {
      if (riderStatus === 'recovery') {
        rider.riderStatus = 'active';
        rider.isRecoveryBucket = true;
        rider.isPoliceRecovery = false;
        rider.reminderEscalationStage = 3;

        // Trigger Recovery Template
        try {
          const { sendAutomatedPaymentLink } = require('../utils/paymentReminders');
          await sendAutomatedPaymentLink(rider, 'warning');
        } catch (warnErr) {
          console.warn('Recovery message failed:', warnErr.message);
        }
      } else if (riderStatus === 'police_recovery') {
        rider.riderStatus = 'active';
        rider.isPoliceRecovery = true;
        rider.isRecoveryBucket = false;
        rider.reminderEscalationStage = 0;
      } else if (riderStatus === 'active') {
        rider.riderStatus = 'active';
        rider.isRecoveryBucket = false;
        rider.isPoliceRecovery = false;
        rider.reminderEscalationStage = 0;
      } else if (riderStatus === 'inactive') {
        rider.riderStatus = 'inactive';
        rider.isRecoveryBucket = false;
        rider.isPoliceRecovery = false;
        rider.reminderEscalationStage = 0;
      } else {
        rider.riderStatus = riderStatus;
      }
    }

    if (req.body.securityDeposit !== undefined) {
      rider.securityDeposit = Number(req.body.securityDeposit);
    }
    if (req.body.rentalRate !== undefined) {
      rider.rentalRate = Number(req.body.rentalRate);
    }

    // Handle recovery bucket exit due date calculation
    if (wasInRecovery && !rider.isRecoveryBucket && !returnDate) {
      rider.recoveryRemovedAt = new Date();
      rider.deployDate = new Date();
      const { calculateNextReturnDate } = require('../utils/scheduleHelper');
      rider.returnDate = calculateNextReturnDate(new Date());
    }

    // Handle police recovery bucket exit due date calculation
    if (wasInPoliceRecovery && !rider.isPoliceRecovery && !returnDate) {
      rider.policeRecoveryRemovedAt = new Date();
      rider.deployDate = new Date();
      const { calculateNextReturnDate } = require('../utils/scheduleHelper');
      rider.returnDate = calculateNextReturnDate(new Date());
    }

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
    const { 
      riderStatus, 
      paymentStatus, 
      isRecoveryBucket, 
      isPoliceRecovery,
      search, 
      dueFrom, 
      dueTo, 
      vehicleNumber 
    } = req.query;

    const filter = {};
    if (riderStatus) filter.riderStatus = riderStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (isRecoveryBucket !== undefined) {
      filter.isRecoveryBucket = isRecoveryBucket === 'true';
    }
    if (isPoliceRecovery !== undefined) {
      filter.isPoliceRecovery = isPoliceRecovery === 'true';
    }
    if (vehicleNumber) filter.vehicleNumber = vehicleNumber.toUpperCase();
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { whatsappNumber: { $regex: search } },
        { vehicleNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (dueFrom || dueTo) {
      filter.returnDate = {};
      if (dueFrom) filter.returnDate.$gte = new Date(dueFrom);
      if (dueTo) {
        const to = new Date(dueTo);
        to.setHours(23, 59, 59, 999);
        filter.returnDate.$lte = to;
      }
    }

    const riders = await Rider.find(filter).sort({ returnDate: 1 });
    res.status(200).json({ 
      success: true, 
      count: riders.length, 
      data: riders 
    });
  } catch (err) {
    console.error('getRiders error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { paymentStatus, riderStatus, isRecoveryBucket, isPoliceRecovery } = req.body;
    const rider = await Rider.findById(req.params.id);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    const wasInRecovery = rider.isRecoveryBucket;
    const wasInPoliceRecovery = rider.isPoliceRecovery;

    // Handle payment status changes
    if (paymentStatus) {
      if (paymentStatus === 'paid') {
        const { calculateNextReturnDate } = require('../utils/scheduleHelper');
        rider.returnDate = calculateNextReturnDate(rider.returnDate);
        rider.totalWeeks = (rider.totalWeeks || 0) + 1;
        
        // Reset escalation and recovery on payment
        rider.reminderEscalationStage = 0;
        rider.isRecoveryBucket = false;
        rider.isPoliceRecovery = false;
        rider.lastAutomatedReminderDate = null; // allow fresh reminder next cycle

        if (!rider.bikesUsed.includes(rider.vehicleNumber)) {
          rider.bikesUsed.push(rider.vehicleNumber);
        }

        let riderRate = rider.rentalRate;
        if (!riderRate) {
          const config = await SystemConfig.findOne({ key: 'WEEKLY_RENTAL_AMOUNT' });
          riderRate = config ? config.value : 2000;
        }

        await createInvoiceRecord(
          rider, 
          req.body.amount || riderRate, 
          'RENT', 
          req.body.remarks || 'Weekly Rental Payment'
        );
      }
      rider.paymentStatus = paymentStatus;
    }

    // Handle recovery bucket manual toggle
    if (isRecoveryBucket !== undefined) {
      rider.isRecoveryBucket = isRecoveryBucket;
      if (isRecoveryBucket) {
        rider.isPoliceRecovery = false; // mutually exclusive
        rider.reminderEscalationStage = 3; // Max stage if manually moved

        // Trigger Recovery Template
        try {
          const { sendAutomatedPaymentLink } = require('../utils/paymentReminders');
          await sendAutomatedPaymentLink(rider, 'warning');
        } catch (warnErr) {
          console.warn('Recovery message failed:', warnErr.message);
        }
      }
    }

    // Handle police recovery manual toggle
    if (isPoliceRecovery !== undefined) {
      rider.isPoliceRecovery = isPoliceRecovery;
      if (isPoliceRecovery) {
        rider.isRecoveryBucket = false; // mutually exclusive
        rider.reminderEscalationStage = 0;
      }
    }

    // Handle soft deletion / archiving / bucket changes
    if (riderStatus) {
      if (riderStatus === 'recovery') {
        rider.riderStatus = 'active';
        rider.isRecoveryBucket = true;
        rider.isPoliceRecovery = false;
        rider.reminderEscalationStage = 3;

        // Trigger Recovery Template
        try {
          const { sendAutomatedPaymentLink } = require('../utils/paymentReminders');
          await sendAutomatedPaymentLink(rider, 'warning');
        } catch (warnErr) {
          console.warn('Recovery message failed:', warnErr.message);
        }
      } else if (riderStatus === 'police_recovery') {
        rider.riderStatus = 'active';
        rider.isPoliceRecovery = true;
        rider.isRecoveryBucket = false;
        rider.reminderEscalationStage = 0;
      } else if (riderStatus === 'active') {
        rider.riderStatus = 'active';
        rider.isRecoveryBucket = false;
        rider.isPoliceRecovery = false;
        rider.reminderEscalationStage = 0;
      } else if (riderStatus === 'inactive') {
        rider.riderStatus = 'inactive';
        rider.isRecoveryBucket = false;
        rider.isPoliceRecovery = false;
        rider.reminderEscalationStage = 0;
      } else if (riderStatus === 'returned') {
        rider.riderStatus = 'returned';
        rider.returnDate = new Date();
        rider.isRecoveryBucket = false;
        rider.isPoliceRecovery = false;
      } else {
        rider.riderStatus = riderStatus;
      }
    }

    // Handle recovery bucket exit due date calculation
    if (wasInRecovery && !rider.isRecoveryBucket) {
      rider.recoveryRemovedAt = new Date();
      rider.deployDate = new Date();
      const { calculateNextReturnDate } = require('../utils/scheduleHelper');
      rider.returnDate = calculateNextReturnDate(new Date());
    }

    // Handle police recovery bucket exit due date calculation
    if (wasInPoliceRecovery && !rider.isPoliceRecovery) {
      rider.policeRecoveryRemovedAt = new Date();
      rider.deployDate = new Date();
      const { calculateNextReturnDate } = require('../utils/scheduleHelper');
      rider.returnDate = calculateNextReturnDate(new Date());
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

// @POST /api/riders/:id/damage
// @desc Add a damage charge and send payment link
exports.addDamage = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (!amount || !reason) {
      return res.status(400).json({ success: false, message: 'Amount and reason are required' });
    }

    const rider = await Rider.findById(req.params.id);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    // 1. Create a Damage Invoice
    const invoiceNum = `INV-DMG-${Date.now().toString().slice(-6)}`;
    const today = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const billingMonth = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    const newInvoice = await Invoice.create({
      billingMonth,
      riderId: rider._id,
      riderName: rider.name,
      invoiceType: 'REPAIR & DAMAGE',
      invoiceNum,
      billAmount: amount,
      actualRent: 0,
      securityDeposit: 0,
      remarks: reason
    });

    // 2. Create Payment Link for Damage based on Gateway Selection
    const gateway = process.env.PAYMENT_GATEWAY || 'razorpay';
    let responseId = '';
    let responseUrl = '';

    if (gateway === 'phonepe') {
      const response = await phonepe.createPaymentLink({
        riderId: rider._id,
        amount: amount * 100, // in paise
        mobileNumber: rider.whatsappNumber,
        description: `Damage Charge: ${reason} - ${rider.vehicleNumber}`
      });
      responseId = response.id;
      responseUrl = response.url;
    } else {
      // Default: Razorpay
      const uniqueLinkId = `pl_dmg_${rider._id.toString().slice(-12)}_${Date.now().toString().slice(-6)}`;
      const response = await razorpay.paymentLink.create({
        amount: amount * 100,
        currency: "INR",
        accept_partial: false,
        description: `Damage Charge: ${reason} - ${rider.vehicleNumber}`,
        customer: {
          name: rider.name,
          contact: rider.whatsappNumber,
        },
        notify: {
          sms: false,
          email: false
        },
        notes: {
          riderId: rider._id.toString(),
          link_id: uniqueLinkId
        },
        callback_url: `${process.env.BACKEND_URL || 'https://rideforyouev.com'}/api/payments/callback`,
        callback_method: "get"
      });
      responseId = response.id;
      responseUrl = response.short_url;
    }

    // Save link to DB so the shortened URL redirector can look it up
    rider.paymentLinkId = responseId;
    rider.paymentLinkUrl = responseUrl;
    await rider.save();

    const paymentLink = `${process.env.BACKEND_URL || 'https://rideforyouev.com'}/api/payments/pay/${rider._id}`;

    // 3. Send WhatsApp Notification
    if (rider.whatsappNumber) {
      const body = `🛠️ *Damage Charge - Ride For You*\n\nHello *${rider.name}*,\n\nA damage charge has been added to your account for vehicle *${rider.vehicleNumber}*.\n\n*Reason:* ${reason}\n*Amount:* ₹${amount}\n\nPlease pay using this link to avoid service interruption:\n🔗 *Pay Now:* ${paymentLink}`;
      
      const mediaUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLink)}`;
      
      try {
        await sendPaymentReminder(rider.whatsappNumber, { body, mediaUrl });
      } catch (waErr) {
        console.warn(`WhatsApp failed for damage notice: ${waErr.message}`);
        // We still return success because the invoice and link were created
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Damage recorded and payment link sent',
      data: newInvoice
    });

  } catch (err) {
    console.error('Add Damage Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
