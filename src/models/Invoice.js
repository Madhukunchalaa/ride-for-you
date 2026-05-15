const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    billingMonth: {
      type: String,
      required: true // e.g., "February 2026"
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider'
    },
    riderName: String,
    invoiceType: {
      type: String,
      enum: ['RENT', 'RECOVERY', 'REPAIR & DAMAGE', 'OTHERS'],
      required: true
    },
    invoiceNum: {
      type: String,
      required: true
    },
    billAmount: {
      type: Number,
      required: true,
      default: 0
    },
    actualRent: {
      type: Number,
      required: true,
      default: 0
    },
    securityDeposit: {
      type: Number,
      default: 0
    },
    remarks: {
      type: String,
      trim: true
    },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
