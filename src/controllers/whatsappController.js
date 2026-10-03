const twilio = require('twilio');
const Rider = require('../models/Rider');
const Customer = require('../models/customer');
const { sendReengageMessage, sendCustomBroadcastMessage } = require('../utils/whatsapp');
const { sendAutomatedPaymentLink } = require('../utils/paymentReminders');


/**
 * Handles incoming WhatsApp messages from Twilio Webhook
 */
exports.handleIncoming = async (req, res) => {
  const { Body, From } = req.body;
  
  console.log(`📩 Incoming WhatsApp from ${From}: ${Body}`);

  try {
    const twiml = new twilio.twiml.MessagingResponse();
    
    const message = Body.toLowerCase();

    if (message.includes('paid') || message.includes('done')) {
      twiml.message('Thank you for the update! ⚡ Our team will verify the payment and update your status shortly.');
    } else if (message.includes('help') || message.includes('support')) {
      twiml.message('Need help? 🛠️ You can contact our support team at +91 7989776255 or visit our office.');
    } else {
      twiml.message('Hello! 👋 This is an automated response from Ride For You. If you have questions about your rental, please contact support or reply with "HELP".');
    }

    res.type('text/xml').send(twiml.toString());
  } catch (err) {
    console.error('❌ Webhook Error:', err);
    res.status(500).send('Error processing message');
  }
};

/**
 * Sends re-engagement messages to all past (inactive) riders
 */
exports.sendBulkReengage = async (req, res) => {
  try {
    // Include both 'inactive' (past) and 'returned' riders
    const pastRiders = await Rider.find({ riderStatus: { $in: ['inactive', 'returned'] } });
    const customers = await Customer.find({ leadStatus: { $ne: 'Converted' } }); // Re-engage non-converted leads
    
    const recipients = [
      ...pastRiders.map(r => ({ name: r.name, phone: r.whatsappNumber, id: r._id, type: 'rider' })),
      ...customers.map(c => ({ name: c.name, phone: c.phone, id: c._id, type: 'customer' }))
    ];

    if (recipients.length === 0) {
      return res.status(200).json({ success: true, message: 'No recipients found to re-engage.' });
    }

    console.log(`🚀 Bulk Re-engage: Started background job for ${recipients.length} recipients...`);

    // Return immediately to prevent HTTP Timeout
    res.status(200).json({
      success: true,
      count: recipients.length,
      message: `Broadcast successfully started for ${recipients.length} contacts.`
    });

    const websiteLink = process.env.FRONTEND_URL || 'https://rideforyouev.com';

    // Process in background
    (async () => {
      for (const person of recipients) {
        try {
          await sendReengageMessage(person.phone, person.name, websiteLink);
        } catch (err) {
          console.error(`❌ Failed to send to ${person.name}:`, err.message);
        }
        // Small delay to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      console.log('✅ Bulk Re-engage background job completed.');
    })();

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Sends a custom broadcast message to all active/inactive/returned riders or customers
 * @POST /api/whatsapp/bulk-custom
 */
exports.sendBulkCustom = async (req, res) => {
  try {
    const { customText, targetAudience } = req.body; // targetAudience could be 'all', 'riders', 'leads'
    const file = req.file;

    if (!customText) {
      return res.status(400).json({ success: false, message: 'Custom text is required' });
    }

    let headerImage = null;
    if (file) {
      const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
      headerImage = `${baseUrl}/assets/${file.filename}`;
    }

    // Determine recipients
    let recipients = [];
    if (targetAudience === 'riders' || targetAudience === 'all') {
      const riders = await Rider.find();
      recipients.push(...riders.map(r => ({ name: r.name, phone: r.whatsappNumber, id: r._id, type: 'rider' })));
    }
    if (targetAudience === 'leads' || targetAudience === 'all') {
      const customers = await Customer.find({ leadStatus: { $ne: 'Converted' } });
      recipients.push(...customers.map(c => ({ name: c.name, phone: c.phone, id: c._id, type: 'customer' })));
    }

    if (recipients.length === 0) {
      return res.status(200).json({ success: true, message: 'No recipients found.' });
    }

    console.log(`🚀 Custom Bulk Broadcast: Started background job for ${recipients.length} recipients...`);

    // Return immediately to prevent HTTP Timeout
    res.status(200).json({
      success: true,
      count: recipients.length,
      message: `Broadcast successfully started for ${recipients.length} contacts.`
    });

    // Process in background
    (async () => {
      for (const person of recipients) {
        try {
          await sendCustomBroadcastMessage(person.phone, person.name, customText, headerImage);
        } catch (err) {
          console.error(`❌ Failed to send to ${person.name}:`, err.message);
        }
        // Small delay to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      console.log('✅ Custom Bulk Broadcast background job completed.');
    })();

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Audit: Get recent reminder logs
 * @GET /api/whatsapp/logs
 */
exports.getReminderLogs = async (req, res) => {
  try {
    const { riderId, limit = 50 } = req.query;
    const filter = {};
    if (riderId) filter.riderId = riderId;

    const ReminderLog = require('../models/ReminderLog');
    const logs = await ReminderLog.find(filter)
      .sort({ sentAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * MANUAL TEST: Send QR reminder to a specific rider by ID
 * @POST /api/whatsapp/send-qr/:riderId
 */
exports.sendQrReminder = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.riderId);
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    console.log(`📲 [MANUAL] Sending QR reminder to ${rider.name} (${rider.whatsappNumber})...`);
    const success = await sendAutomatedPaymentLink(rider, 'normal');

    if (success) {
      res.status(200).json({ success: true, message: `QR reminder sent to ${rider.name} (${rider.whatsappNumber})` });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send QR reminder. Check server logs.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * MANUAL TEST: Send QR reminder to ALL active + unpaid riders at once
 * @POST /api/whatsapp/send-qr-all
 */
exports.sendQrReminderToAll = async (req, res) => {
  try {
    const riders = await Rider.find({
      riderStatus: 'active',
      paymentStatus: 'unpaid',
      isPoliceRecovery: { $ne: true }
    });

    if (riders.length === 0) {
      return res.status(200).json({ success: true, message: 'No unpaid active riders found.' });
    }

    console.log(`📲 [MANUAL BULK] Sending QR reminder to ${riders.length} riders...`);

    const results = [];
    for (const rider of riders) {
      const success = await sendAutomatedPaymentLink(rider, 'normal');
      results.push({ name: rider.name, phone: rider.whatsappNumber, status: success ? 'sent' : 'failed' });
    }

    res.status(200).json({
      success: true,
      total: riders.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      details: results
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
