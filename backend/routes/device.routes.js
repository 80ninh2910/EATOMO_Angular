const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const authMiddleware = require('../middleware/auth');

// All device routes require authentication
router.use(authMiddleware);

// Register FCM token after login
router.post('/register', deviceController.registerDevice);

// Unregister FCM token on logout
router.delete('/unregister', deviceController.unregisterDevice);

module.exports = router;
