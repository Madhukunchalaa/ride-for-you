const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Rider name is required'],
      trim: true
    },
    whatsappNumber: {
      type: String,
      required: [true, 'WhatsApp number is required'],
      trim: true
    },
    riderStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true
    },
    deployDate: {
      type: Date,
      required: [true, 'Deploy date is required']
    },
    returnDate: {
      type: Date,
      required: [true, 'Return date is required']
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'unpaid'],
      default: 'unpaid'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rider', riderSchema);
