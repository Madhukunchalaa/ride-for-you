const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  updatedBy: {
    type: String,
    default: 'system'
  },
  history: [{
    value: mongoose.Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'admin' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
