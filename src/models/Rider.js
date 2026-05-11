const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
      unique: true,
      trim: true
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true // Allow nulls for now as we transition
    },
    password: {
      type: String,
      select: false
    },
    otp: {
      type: String
    },
    otpExpires: {
      type: Date
    },
    riderStatus: {
      type: String,
      enum: ['active', 'inactive', 'returned', 'recovery'],
      default: 'active'
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true
    },
    deployDate: {
      type: Date
    },
    returnDate: {
      type: Date
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'unpaid'],
      default: 'unpaid'
    },
    paymentLinkId: {
      type: String
    },
    paymentLinkUrl: {
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
      default: "12:00"
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
    },
    rentalRate: {
      type: Number // Locked rate at the time of onboarding
    },
    securityDeposit: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Hash password before saving
riderSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password method
riderSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Rider', riderSchema);
