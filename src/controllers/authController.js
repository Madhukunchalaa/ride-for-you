const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @POST /api/auth/login
exports.login = async (req, res) => {
  try {
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

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
