const CustomPayment = require('../models/CustomPayment');
const phonepe = require('../config/phonepe');
const razorpay = require('../config/razorpay');
const { sendPaymentReminder } = require('../utils/whatsapp');

// @GET /api/payments/custom
// @desc Get all custom payments with stats
exports.getCustomPayments = async (req, res) => {
  try {
    const payments = await CustomPayment.find().sort({ createdAt: -1 });

    // Calculate dynamic stats
    const totalCollected = payments
      .filter(p => p.paymentStatus === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPending = payments
      .filter(p => p.paymentStatus === 'unpaid')
      .reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      stats: {
        totalCollected,
        totalPending,
        totalCount: payments.length
      },
      payments
    });
  } catch (err) {
    console.error('Error fetching custom payments:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve custom payments' });
  }
};

// @POST /api/payments/custom
// @desc Create a new custom payment (supports Cash, UPI, or Online link)
exports.createCustomPayment = async (req, res) => {
  try {
    const { name, whatsappNumber, amount, remarks, paymentMethod } = req.body;

    if (!name || !whatsappNumber || !amount || !remarks || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Clean phone number
    let cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const customPayment = new CustomPayment({
      name,
      whatsappNumber: cleanPhone,
      amount: Number(amount),
      remarks,
      paymentMethod,
      paymentStatus: paymentMethod === 'ONLINE_LINK' ? 'unpaid' : 'paid',
      paymentDate: paymentMethod === 'ONLINE_LINK' ? null : new Date()
    });

    await customPayment.save();

    // If ONLINE_LINK, generate payment link
    if (paymentMethod === 'ONLINE_LINK') {
      const gateway = process.env.PAYMENT_GATEWAY || 'razorpay';
      const amountVal = Number(amount) * 100; // to paise/cents
      let responseId = '';
      let responseUrl = '';

      if (gateway === 'phonepe') {
        const response = await phonepe.createPaymentLink({
          riderId: customPayment._id, // reuse createPaymentLink parameter
          amount: amountVal,
          mobileNumber: cleanPhone,
          description: `Ride For You - ${remarks.slice(0, 30)}`
        });
        responseId = response.id;
        responseUrl = response.url;
      } else {
        // Razorpay
        const uniqueLinkId = `pl_cust_${customPayment._id.toString().slice(-12)}_${Date.now().toString().slice(-6)}`;
        const response = await razorpay.paymentLink.create({
          amount: amountVal,
          currency: "INR",
          accept_partial: false,
          description: `Payment for: ${remarks}`,
          customer: {
            name: name,
            contact: cleanPhone,
          },
          notify: {
            sms: false,
            email: false
          },
          reminder_enable: false,
          notes: {
            customPaymentId: customPayment._id.toString(),
            link_id: uniqueLinkId
          },
          callback_url: `${process.env.BACKEND_URL || 'https://rideforyouev.com'}/api/payments/callback`,
          callback_method: "get"
        });
        responseId = response.id;
        responseUrl = response.short_url;
      }

      // Generate a clean short redirect URL specifically for custom payments
      const shortUrl = `${process.env.BACKEND_URL || 'https://rideforyouev.com'}/api/payments/pay/custom/${customPayment._id}`;
      customPayment.paymentLinkId = responseId;
      customPayment.paymentLinkUrl = responseUrl;
      await customPayment.save();

      // Send to WhatsApp using payment_reminder_v1 template
      try {
        await sendPaymentReminder(cleanPhone, {
          templateName: 'payment_reminder_v1',
          variables: {
            1: name,
            2: remarks,
            3: 'Immediate',
            4: shortUrl
          }
        });
      } catch (waErr) {
        console.error('WhatsApp custom payment link delivery failed:', waErr.message);
      }
    } else {
      // If manually paid CASH or UPI, send manual receipt directly on WhatsApp
      try {
        const receiptBody = `✅ *Payment Recorded! - Ride For You*\n\nHello *${name}*,\n\nWe have recorded your manual payment of *₹${amount}* for *${remarks}*.\n\nThank you! ⚡`;
        await sendPaymentReminder(cleanPhone, { body: receiptBody });
      } catch (waErr) {
        console.error('WhatsApp custom receipt delivery failed:', waErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: paymentMethod === 'ONLINE_LINK' ? 'Payment link created and sent successfully' : 'Manual payment recorded successfully',
      payment: customPayment
    });
  } catch (err) {
    console.error('Error creating custom payment:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create payment' });
  }
};

// @PATCH /api/payments/custom/:id
// @desc Mark custom payment as paid/unpaid manually
exports.updateCustomPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod } = req.body;

    const payment = await CustomPayment.findById(id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    if (paymentStatus) {
      payment.paymentStatus = paymentStatus;
      payment.paymentDate = paymentStatus === 'paid' ? new Date() : null;
    }
    if (paymentMethod) {
      payment.paymentMethod = paymentMethod;
    }

    await payment.save();
    res.status(200).json({ success: true, message: 'Payment record updated successfully', payment });
  } catch (err) {
    console.error('Error updating custom payment:', err);
    res.status(500).json({ success: false, message: 'Failed to update payment record' });
  }
};

// @DELETE /api/payments/custom/:id
// @desc Delete a custom payment record
exports.deleteCustomPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await CustomPayment.findByIdAndDelete(id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    res.status(200).json({ success: true, message: 'Payment record deleted successfully' });
  } catch (err) {
    console.error('Error deleting custom payment:', err);
    res.status(500).json({ success: false, message: 'Failed to delete payment record' });
  }
};
