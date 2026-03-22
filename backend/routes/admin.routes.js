const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// All routes require admin
router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/revenue', adminController.getRevenueChart);
router.get('/dashboard/top-products', adminController.getTopProducts);
router.get('/dashboard/recent-orders', adminController.getRecentOrders);

// Orders
router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// Bowls CRUD
router.post('/bowls', adminController.createBowl);
router.patch('/bowls/:id', adminController.updateBowl);
router.delete('/bowls/:id', adminController.deleteBowl);

// Customers
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.delete('/customers/:id', adminController.deleteCustomer); // <-- THÊM DÒNG NÀY VÀO ĐÂY
module.exports = router;
