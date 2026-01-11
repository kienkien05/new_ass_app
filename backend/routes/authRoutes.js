const express = require('express');
const router = express.Router();
const {
    registerUser,
    verifyRegisterOTP,
    loginUser,
    verifyLoginOTP,
    resendOTPCode,
    getUserProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate, registerRules, loginRules } = require('../middleware/validationMiddleware');

// Auth routes with validation
router.post('/register', registerRules, validate, registerUser);
router.post('/verify-register', verifyRegisterOTP);
router.post('/login', loginRules, validate, loginUser);
router.post('/verify-login', verifyLoginOTP);
router.post('/resend-otp', resendOTPCode);
router.get('/me', protect, getUserProfile);

module.exports = router;
