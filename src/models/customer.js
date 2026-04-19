const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    message: String,
    leadStatus: {
        type: String,
        enum: ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted'],
        default: 'New'
    },
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Customer', customerSchema);