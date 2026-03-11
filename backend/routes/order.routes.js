const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

router.post('/', orderController.createOrder);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;
