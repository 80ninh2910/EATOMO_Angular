const Bowl = require('../models/Bowl');
const Order = require('../models/Order');
const Voucher = require('../models/Voucher');
const { canTransitionOrderStatus } = require('../utils/order-status');
const {
  normalizeVoucherCode,
  buildVoucherValidation,
  calculateVoucherDiscount
} = require('../utils/voucher');

/**
 * POST /api/orders — Tạo đơn hàng mới
 */
exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, deliveryPhone, deliveryNotes, paymentMethod, voucherCode } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }
    if (!deliveryAddress || !deliveryPhone) {
      return res.status(400).json({ success: false, message: 'Delivery address and phone are required' });
    }

    // Fetch bowl details
    const bowlIds = items.map(i => i.bowlId);
    const bowls = await Bowl.find({ _id: { $in: bowlIds } });
    const bowlMap = {};
    bowls.forEach(b => { bowlMap[b._id] = b; });

    // Validate & calculate
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const bowl = bowlMap[item.bowlId];
      if (!bowl) {
        return res.status(400).json({ success: false, message: `Bowl ${item.bowlId} not found` });
      }
      if (!bowl.inStock) {
        return res.status(400).json({ success: false, message: `${bowl.name} is out of stock` });
      }

      const itemSubtotal = bowl.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        bowlId: bowl._id,
        bowlName: bowl.name,
        unitPrice: bowl.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        customProteins: item.customProteins || [],
        customVeggies: item.customVeggies || [],
        customSauces: item.customSauces || []
      });
    }

    const tax = Math.round(subtotal * 0.08);
    const shippingFee = subtotal > 500000 ? 0 : 30000;

    // Voucher discount
    let discountAmount = 0;
    let appliedVoucher = null;
    let appliedVoucherCode = '';

    if (voucherCode && String(voucherCode).trim()) {
      appliedVoucherCode = normalizeVoucherCode(voucherCode);

      const voucher = await Voucher.findOne({
        code: appliedVoucherCode,
        isActive: true
      });

      const validation = buildVoucherValidation(voucher, subtotal);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
      }

      appliedVoucher = voucher;
      discountAmount = calculateVoucherDiscount(voucher, subtotal);
    }

    const totalAmount = subtotal + tax + shippingFee - discountAmount;
    const orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase();

    const order = await Order.create({
      orderNumber,
      userId,
      status: 'pending',
      trackingProgress: 10,
      trackingUpdatedAt: new Date(),
      statusHistory: [{
        status: 'pending',
        changedAt: new Date(),
        changedBy: userId,
        source: 'user'
      }],
      items: orderItems,
      subtotal,
      tax,
      shippingFee,
      discountAmount,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'unpaid',
      deliveryAddress,
      deliveryPhone,
      deliveryNotes: deliveryNotes || '',
      voucherCode: appliedVoucherCode
    });

    if (appliedVoucher) {
      await Voucher.findByIdAndUpdate(appliedVoucher._id, { $inc: { currentUses: 1 } });
    }

    res.status(201).json({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingProgress: order.trackingProgress,
      trackingUpdatedAt: order.trackingUpdatedAt,
      statusHistory: order.statusHistory,
      items: order.items,
      subtotal, tax, shippingFee, discountAmount, totalAmount,
      voucherCode: order.voucherCode,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryAddress, deliveryPhone, deliveryNotes,
      createdAt: order.createdAt
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
};

/**
 * GET /api/orders — Đơn hàng của user (có phân trang)
 * Query: ?page=1&limit=10
 */
exports.getMyOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // max 50
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ userId: req.user.id })
    ]);

    res.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get orders', error: error.message });
  }
};

/**
 * GET /api/orders/:id — Chi tiết đơn hàng
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Failed to get order', error: error.message });
  }
};

/**
 * PATCH /api/orders/:id/cancel — Hủy đơn hàng
 * Chỉ cho phép hủy khi status = 'pending'
 */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!canTransitionOrderStatus(order.status, 'cancelled') || order.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: 'Only pending orders can be cancelled.'
      });
    }

    order.status = 'cancelled';
    order.trackingProgress = 0;
    order.trackingUpdatedAt = new Date();
    order.statusHistory = order.statusHistory || [];
    if (order.statusHistory.length === 0) {
      order.statusHistory.push({
        status: 'pending',
        changedAt: order.createdAt || new Date(),
        source: 'system'
      });
    }
    order.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date(),
      changedBy: req.user.id,
      source: 'user'
    });
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: order.toJSON()
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order', error: error.message });
  }
};
