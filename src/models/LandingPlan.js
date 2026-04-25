const mongoose = require('mongoose');

const landingPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    rental: {
      type: String,
      required: true
    },
    platformFee: {
      type: String,
      required: true
    },
    bookingFee: {
      type: String,
      default: '200'
    },
    total: {
      type: String,
      required: true
    },
    image: {
      type: String, // URL or relative path
      default: '/assets/storm.png'
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LandingPlan', landingPlanSchema);
