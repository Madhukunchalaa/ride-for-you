const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Rider = require('../models/Rider');
const { sendPaymentReminder } = require('../utils/whatsapp');
const crypto = require('crypto');

// Helper to clean and standardize WhatsApp number
const cleanNumber = (num) => {
  if (!num) return '';
  return num.replace(/[^0-9]/g, '').slice(-10);
};

// @POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, whatsappNumber, password } = req.body;
    
    if ((!email && !whatsappNumber) || !password) {
      return res.status(400).json({ success: false, message: 'Please provide credentials and password' });
    }

    let account;
    let role = 'rider';

    if (email) {
      account = await User.findOne({ email }).select('+password');
      role = account?.role || 'admin';
    } else {
      const searchNumber = cleanNumber(whatsappNumber);
      // Check User (Admin) first
      account = await User.findOne({ whatsappNumber: searchNumber }).select('+password');
      if (account) {
        role = account.role;
      } else {
        // Check Rider
        account = await Rider.findOne({ whatsappNumber: searchNumber }).select('+password');
        role = 'rider';
      }
    }

    if (!account) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const tokenOptions = {};
    const searchNumber = cleanNumber(whatsappNumber || account.whatsappNumber);
    if (searchNumber === '7989776255') {
      console.log('Admin detected. Token will not expire.');
    } else {
      tokenOptions.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    }

    const token = jwt.sign({ id: account._id, role }, process.env.JWT_SECRET, tokenOptions);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { 
        id: account._id, 
        email: account.email, 
        name: account.name, 
        role, 
        whatsappNumber: account.whatsappNumber 
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/request-otp
exports.requestOtp = async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    if (!whatsappNumber) {
      return res.status(400).json({ success: false, message: 'Please provide a WhatsApp number' });
    }

    const searchNumber = cleanNumber(whatsappNumber);
    let account = await User.findOne({ whatsappNumber: searchNumber });
    
    if (!account) {
      // If it's the admin default number, auto-create in User model
      if (searchNumber === '7989776255') {
        account = await User.create({
          name: 'Super Admin',
          email: 'admin@evride.com',
          password: 'admin_' + crypto.randomBytes(4).toString('hex'),
          whatsappNumber: searchNumber,
          role: 'admin'
        }).catch(async err => {
          if (err.code === 11000) {
             return await User.findOneAndUpdate({ email: 'admin@evride.com' }, { whatsappNumber: searchNumber }, { new: true });
          }
          throw err;
        });
      } else {
        // Check if it's a Rider
        account = await Rider.findOne({ whatsappNumber: searchNumber });
      }
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Number not registered for login.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    account.otp = otp;
    account.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await account.save();

    await sendPaymentReminder(whatsappNumber, {
      body: `Your Ride For You login OTP is: *${otp}*. Valid for 10 minutes.`
    });

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Request OTP Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { whatsappNumber, otp } = req.body;
    if (!whatsappNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide number and OTP' });
    }

    const searchNumber = cleanNumber(whatsappNumber);
    let account = await User.findOne({ whatsappNumber: searchNumber });
    let role = 'admin';

    if (!account) {
      account = await Rider.findOne({ whatsappNumber: searchNumber });
      role = 'rider';
    }

    if (!account || account.otp !== otp || account.otpExpires < Date.now()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    account.otp = undefined;
    account.otpExpires = undefined;
    await account.save();

    const tokenOptions = {};
    if (searchNumber === '7989776255') {
      console.log('Admin detected. Token will not expire.');
    } else {
      tokenOptions.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    }

    const token = jwt.sign({ id: account._id, role }, process.env.JWT_SECRET, tokenOptions);

    res.json({
      success: true,
      message: 'OTP Login successful',
      token,
      user: { 
        id: account._id, 
        email: account.email, 
        name: account.name, 
        role, 
        whatsappNumber: account.whatsappNumber 
      }
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    if (!whatsappNumber) {
      return res.status(400).json({ success: false, message: 'Please provide a WhatsApp number' });
    }

    const searchNumber = cleanNumber(whatsappNumber);
    let account = await User.findOne({ whatsappNumber: searchNumber });
    if (!account) {
      account = await Rider.findOne({ whatsappNumber: searchNumber });
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found with this number' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    account.otp = otp;
    account.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await account.save();

    await sendPaymentReminder(whatsappNumber, {
      body: `Your Ride For You password reset OTP is: *${otp}*. Valid for 10 minutes.`
    });

    res.json({ success: true, message: 'Reset OTP sent to WhatsApp' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { whatsappNumber, otp, newPassword } = req.body;
    if (!whatsappNumber || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const searchNumber = cleanNumber(whatsappNumber);
    let account = await User.findOne({ whatsappNumber: searchNumber });
    if (!account) {
      account = await Rider.findOne({ whatsappNumber: searchNumber });
    }

    if (!account || account.otp !== otp || account.otpExpires < Date.now()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }

    account.password = newPassword;
    account.otp = undefined;
    account.otpExpires = undefined;
    await account.save();

    res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    // Check User model first
    let account = await User.findById(req.user.id).select('+password');
    if (!account) {
      // Check Rider model
      account = await Rider.findById(req.user.id).select('+password');
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const isMatch = await account.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    account.password = newPassword;
    await account.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change Password Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
