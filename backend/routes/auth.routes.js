const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
