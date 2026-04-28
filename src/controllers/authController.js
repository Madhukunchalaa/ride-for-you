const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPaymentReminder } = require('../utils/whatsapp');
const crypto = require('crypto');

// @POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔑 Login attempt: ${email}`);
    if (!email || !password) {
      console.log('⚠️ Missing email or password');
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // 1. Check if user exists
    const user = await User.findOne({ email }).select('+password');
    console.log(`👤 User found: ${!!user}`);
    
    if (!user || !user.password) {
      console.log('❌ User not found or password missing in DB');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 2. Check password
    console.log('🔄 Comparing passwords...');
    const isMatch = await user.comparePassword(password);
    console.log(`✅ Password match: ${isMatch}`);
    
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 3. Generate JWT
    console.log('🎫 Generating JWT...');
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const tokenOptions = {};
    if (user.whatsappNumber === '7989776255') {
      console.log('Admin whatsapp number detected. Token will not expire.');
      // Omit expiresIn so it lasts forever
    } else {
      tokenOptions.expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, tokenOptions);

    console.log('🚀 Login successful, sending response');
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
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

    // Clean number
    let cleaned = whatsappNumber.replace(/[^0-9]/g, '');
    if (cleaned.length === 10) cleaned = '91' + cleaned;
    else if (cleaned.startsWith('91') && cleaned.length === 12) { /* already starts with 91 */ }
    else {
      // just default to taking last 10
      cleaned = '91' + cleaned.slice(-10);
    }
    
    // For lookup, just store what the user inputs or standardize. Let's use standard 10 digit internally if possible, but the user requested 7989776255 specifically.
    const searchNumber = whatsappNumber.replace(/[^0-9]/g, '').slice(-10);

    let user = await User.findOne({ whatsappNumber: searchNumber });
    
    if (!user) {
      // If it's the admin default number, auto-create
      if (searchNumber === '7989776255') {
        user = await User.create({
          name: 'Super Admin',
          email: 'admin@evride.com', // might clash if exists, so let's handle uniqueness
          password: 'temp_' + crypto.randomBytes(8).toString('hex'),
          whatsappNumber: searchNumber,
          role: 'admin'
        }).catch(async err => {
          if (err.code === 11000) {
             // email exists, just update that user with whatsappNumber
             return await User.findOneAndUpdate({ email: 'admin@evride.com' }, { whatsappNumber: searchNumber }, { new: true });
          }
          throw err;
        });
      } else {
        return res.status(404).json({ success: false, message: 'Number not registered for login.' });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

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

    const searchNumber = whatsappNumber.replace(/[^0-9]/g, '').slice(-10);
    const user = await User.findOne({ whatsappNumber: searchNumber });

    if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const tokenOptions = {};
    if (searchNumber === '7989776255') {
      console.log('Admin whatsapp number detected. Token will not expire.');
    } else {
      tokenOptions.expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, tokenOptions);

    res.json({
      success: true,
      message: 'OTP Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role, whatsappNumber: user.whatsappNumber }
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    // Requires authMiddleware
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change Password Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
