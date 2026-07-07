const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

// Protected — require valid JWT
router.get('/profile', authMiddleware, authController.getProfile);
router.patch('/profile', authMiddleware, authController.updateProfile);
router.patch('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
