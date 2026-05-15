const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
  riderName: String,
  whatsappNumber: String,
  type: { 
    type: String, 
    enum: ['automated', 'manual', 'recovery', 'warning', 'otp', 'receipt'] 
  },
  template: String,
  status: { type: String, enum: ['sent', 'failed'] },
  errorMessage: String,
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
