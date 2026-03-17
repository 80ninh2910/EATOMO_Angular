const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Public endpoint. If Authorization header is provided, chatbot can answer user-specific questions.
router.post('/ask', chatController.ask);
router.get('/analytics', chatController.getAnalytics);

module.exports = router;
