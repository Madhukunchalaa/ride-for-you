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
    },
    paymentLinkId: {
      type: String
    },
    bikesUsed: [{
      type: String // List of vehicle numbers
    }],
    complaints: [{
      text: String,
      date: { type: Date, default: Date.now }
    }],
    totalWeeks: {
      type: Number,
      default: 0
    },
    lastWebhookData: {
      type: Object // Stores the last received webhook payload for debugging
    },
    autoReminderEnabled: {
      type: Boolean,
      default: true
    },
    autoReminderTime: {
      type: String,
      default: "10:00"
    },
    reminderEscalationStage: {
      type: Number,
      default: 0 // 0: None, 1: Normal, 2: Warning, 3: Final
    },
    isRecoveryBucket: {
      type: Boolean,
      default: false
    },
    lastAutomatedReminderDate: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rider', riderSchema);
