const express = require('express');
const router = express.Router();

const controller = require('../controllers/admin-ai-chat.controller');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

router.use(authMiddleware, adminMiddleware);

router.get('/health', controller.health);
router.get('/hints', controller.profileHints);
router.get('/metrics', controller.metrics);
router.get('/high-risk-orders', controller.highRiskOrders);
router.get('/monitoring', controller.monitoring);
router.post('/ask', controller.ask);
router.post('/feedback', controller.feedback);
router.post('/predict/order/:orderId', controller.predictFromOrder);

module.exports = router;
