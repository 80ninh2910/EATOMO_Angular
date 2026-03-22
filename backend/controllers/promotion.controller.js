const Voucher = require('../models/Voucher');
const { normalizeVoucherCode, buildVoucherValidation } = require('../utils/voucher');

/**
 * GET /api/vouchers/all — Lấy toàn bộ voucher cho trang user
 */
exports.getPublicVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ isActive: -1, createdAt: -1 });
    res.json(vouchers);
  } catch (error) {
    console.error('Get public vouchers error:', error);
    res.status(500).json({ success: false, message: 'Failed to get vouchers', error: error.message });
  }
};

/**
 * GET /api/promotions — Lấy tất cả promotions (Admin)
 */
exports.getPromotions = async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get promotions', error: error.message });
  }
};

/**
 * POST /api/promotions — Tạo promotion mới (Admin)
 */
exports.createPromotion = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscountAmount,
            validFrom, validUntil, maxUses, target, targetCategory } = req.body;

    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ success: false, message: 'Code, discountType and discountValue are required' });
    }

    // Check duplicate code
    const existing = await Voucher.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Voucher code already exists' });
    }

    const voucher = await Voucher.create({
      code,
      description: description || '',
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      validFrom: validFrom || new Date(),
      validUntil: validUntil || null,
      maxUses: maxUses || 9999,
      currentUses: 0,
      target: target || 'all',
      targetCategory: targetCategory || null,
      isActive: true
    });

    res.status(201).json(voucher);
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ success: false, message: 'Failed to create promotion', error: error.message });
  }
};

/**
 * PATCH /api/promotions/:id — Cập nhật promotion (Admin)
 */
exports.updatePromotion = async (req, res) => {
  try {
    const updates = {};
    const allowed = ['description', 'discountType', 'discountValue', 'minOrderValue',
                     'maxDiscountAmount', 'validFrom', 'validUntil', 'maxUses', 'target', 'targetCategory'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const voucher = await Voucher.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    res.json(voucher);
  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({ success: false, message: 'Failed to update promotion', error: error.message });
  }
};

/**
 * DELETE /api/promotions/:id — Xóa promotion (Admin)
 */
exports.deletePromotion = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    res.json({ success: true, message: 'Promotion deleted' });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete promotion', error: error.message });
  }
};

/**
 * PATCH /api/promotions/:id/toggle — Bật/tắt promotion (Admin)
 */
exports.togglePromotion = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    voucher.isActive = !voucher.isActive;
    await voucher.save();

    res.json({ success: true, isActive: voucher.isActive });
  } catch (error) {
    console.error('Toggle promotion error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle promotion', error: error.message });
  }
};

/**
 * POST /api/vouchers/validate — Validate voucher code (User)
 */
exports.validateVoucher = async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code) {
      return res.json({ valid: false, message: 'Voucher code is required' });
    }

    const voucher = await Voucher.findOne({
      code: normalizeVoucherCode(code),
      isActive: true
    });

    res.json(buildVoucherValidation(voucher, amount));
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({ valid: false, message: 'Failed to validate voucher' });
  }
};
