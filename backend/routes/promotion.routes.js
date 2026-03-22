const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Public: voucher catalog for user-facing pages
router.get('/all', (req, res, next) => {
  if (req.baseUrl.endsWith('/vouchers')) {
    return promotionController.getPublicVouchers(req, res);
  }

  next();
});

// User: validate voucher (requires user auth)
router.post('/validate', authMiddleware, promotionController.validateVoucher);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, promotionController.getPromotions);
router.post('/', authMiddleware, adminMiddleware, promotionController.createPromotion);
router.patch('/:id', authMiddleware, adminMiddleware, promotionController.updatePromotion);
router.delete('/:id', authMiddleware, adminMiddleware, promotionController.deletePromotion);
router.patch('/:id/toggle', authMiddleware, adminMiddleware, promotionController.togglePromotion);

module.exports = router;
