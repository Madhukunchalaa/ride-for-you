const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    month: {
      type: String, // e.g., "April 2026"
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      enum: ['Maintenance', 'Marketing', 'Operations', 'Salary', 'Rent', 'Others'],
      default: 'Others'
    },
    remarks: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
