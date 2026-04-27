const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check header case-insensitively
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (process.env.NODE_ENV !== 'production' || req.url.includes('send-reminder')) {
      console.log(`🔒 Auth Check: ${req.method} ${req.url}`);
      console.log('Headers Received:', JSON.stringify({
        authorization: !!req.headers.authorization,
        Authorization: !!req.headers.Authorization,
        contentType: req.headers['content-type'],
        hasToken: !!authHeader
      }));
    }

    if (authHeader && authHeader.toLowerCase().startsWith('bearer')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      console.warn('⚠️ No token found in request to:', req.url);
      return res.status(401).json({
        success: false,
        message: 'No login token found, please log in'
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists'
        });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied: Admin only'
    });
  }
};
