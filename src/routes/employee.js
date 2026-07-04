const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');

// GET all employees (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json({ success: true, employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CREATE employee (admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const employee = await User.create({ name, email, password, role: 'employee' });
    res.status(201).json({
      success: true,
      employee: { id: employee._id, name: employee.name, email: employee.email, role: employee.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE employee (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const employee = await User.findOneAndDelete({ _id: req.params.id, role: 'employee' });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
