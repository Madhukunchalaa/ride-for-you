const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @POST /api/auth/login
router.post('/login', authController.login);

// OTP routes
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);

// Change password (Requires authentication)
const { protect } = require('../middleware/authMiddleware');
router.post('/change-password', protect, authController.changePassword);

module.exports = router;
