const mongoose = require('mongoose');

const customPaymentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    whatsappNumber: {
      type: String,
      required: [true, 'WhatsApp number is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than 0']
    },
    remarks: {
      type: String,
      required: [true, 'Remarks/Purpose is required'],
      trim: true
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'unpaid'],
      default: 'unpaid'
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'ONLINE_LINK'],
      default: 'ONLINE_LINK'
    },
    paymentLinkId: {
      type: String
    },
    paymentLinkUrl: {
      type: String
    },
    paymentDate: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomPayment', customPaymentSchema);
