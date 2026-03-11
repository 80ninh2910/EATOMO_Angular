const Bowl = require('../models/Bowl');
const Order = require('../models/Order');
const Voucher = require('../models/Voucher');

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
    if (voucherCode) {
      const voucher = await Voucher.findOne({
        code: voucherCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        $or: [{ validUntil: null }, { validUntil: { $gte: new Date() } }],
        $expr: { $lt: ['$currentUses', '$maxUses'] }
      });

      if (voucher && subtotal >= voucher.minOrderValue) {
        if (voucher.discountType === 'percentage') {
          discountAmount = Math.round(subtotal * voucher.discountValue / 100);
          if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
            discountAmount = voucher.maxDiscountAmount;
          }
        } else {
          discountAmount = voucher.discountValue;
        }
        // Increment usage
        await Voucher.findByIdAndUpdate(voucher._id, { $inc: { currentUses: 1 } });
      }
    }

    const totalAmount = subtotal + tax + shippingFee - discountAmount;
    const orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase();

    const order = await Order.create({
      orderNumber,
      userId,
      status: 'pending',
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
      voucherCode: voucherCode || ''
    });

    res.status(201).json({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      items: order.items,
      subtotal, tax, shippingFee, discountAmount, totalAmount,
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
 * GET /api/orders — Đơn hàng của user
 */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
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
 */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: 'pending' },
      { status: 'cancelled' },
      { new: true }
    );

    if (!order) {
      return res.status(400).json({ success: false, message: 'Order not found or cannot be cancelled' });
    }

    res.json({ success: true, message: 'Order cancelled' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order', error: error.message });
  }
};
