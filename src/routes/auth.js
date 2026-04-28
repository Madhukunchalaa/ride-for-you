const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Unified login routes
router.post('/login', authController.login);
router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Authenticated routes
router.post('/change-password', protect, authController.changePassword);

module.exports = router;
