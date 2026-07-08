const Bowl = require('../models/Bowl');
const Order = require('../models/Order');
const User = require('../models/User');
const AdminAction = require('../models/AdminAction');
const Device = require('../models/Device');
const {
  getFirebaseStatus,
  sendToMultipleTokens,
  getOrderStatusNotification,
  getOrderProgressNotification
} = require('../utils/fcm');
const { ORDER_STATUSES, canTransitionOrderStatus } = require('../utils/order-status');

// ═══════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════

/**
 * GET /api/admin/dashboard/stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const [revenueResult] = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalOrders: { $sum: 1 } } }
    ]).exec() || [{ totalRevenue: 0, totalOrders: 0 }];

    const totalRevenue = revenueResult?.totalRevenue || 0;
    const totalOrders = revenueResult?.totalOrders || 0;
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Growth: compare last 30 days vs previous 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    const [currentResult] = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ]).exec() || [{ revenue: 0 }];

    const [prevResult] = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ]).exec() || [{ revenue: 0 }];

    const currentRevenue = currentResult?.revenue || 0;
    const prevRevenue = prevResult?.revenue || 0;
    const revenueGrowth = prevRevenue > 0 ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100) : 0;

    res.json({
      totalRevenue, totalOrders, totalCustomers, avgOrderValue,
      revenueGrowth, orderGrowth: 0, customerGrowth: 0
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get dashboard stats', error: error.message });
  }
};

/**
 * GET /api/admin/dashboard/revenue?period=daily|weekly|monthly&year=YYYY&month=MM&day=DD
 *
 * daily   -> 24 bars theo giờ của một ngày cụ thể
 * weekly  -> 7 bars theo ngày, kết thúc tại ngày đã chọn
 * monthly -> bars theo từng ngày trong tháng đã chọn
 */
exports.getRevenueChart = async (req, res) => {
  try {
    const period = (req.query.period || 'weekly').toLowerCase();

    const now = new Date();
    const selectedYear = Number(req.query.year) || now.getFullYear();
    const selectedMonth = Number(req.query.month) || (now.getMonth() + 1); // 1..12
    const selectedDay = Number(req.query.day) || now.getDate();

    const safeMonth = Math.min(12, Math.max(1, selectedMonth));
    const daysInSelectedMonth = new Date(selectedYear, safeMonth, 0).getDate();
    const safeDay = Math.min(daysInSelectedMonth, Math.max(1, selectedDay));

    let startDate;
    let endDate;
    let labelFormat;
    let labels = [];

    if (period === 'daily') {
      startDate = new Date(selectedYear, safeMonth - 1, safeDay, 0, 0, 0, 0);
      endDate = new Date(selectedYear, safeMonth - 1, safeDay, 23, 59, 59, 999);
      labelFormat = { $dateToString: { format: '%H:00', date: '$createdAt' } };
      labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    } else if (period === 'monthly') {
      const monthDays = new Date(selectedYear, safeMonth, 0).getDate();
      startDate = new Date(selectedYear, safeMonth - 1, 1, 0, 0, 0, 0);
      endDate = new Date(selectedYear, safeMonth - 1, monthDays, 23, 59, 59, 999);
      labelFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      labels = Array.from({ length: monthDays }, (_, i) => `${selectedYear}-${String(safeMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
    } else {
      // weekly rolling 7 days ending selected date
      endDate = new Date(selectedYear, safeMonth - 1, safeDay, 23, 59, 59, 999);
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      labelFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      });
    }

    const rows = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: labelFormat, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, label: '$_id', revenue: 1, orders: 1 } }
    ]);

    const map = {};
    rows.forEach(r => {
      map[r.label] = { label: r.label, revenue: r.revenue || 0, orders: r.orders || 0 };
    });

    const zeroFilled = labels.map(label => map[label] || { label, revenue: 0, orders: 0 });

    res.json(zeroFilled);
  } catch (error) {
    console.error('Revenue chart error:', error);
    res.status(500).json({ success: false, message: 'Failed to get revenue data', error: error.message });
  }
};

/**
 * GET /api/admin/dashboard/top-products?limit=10
 */
exports.getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const rows = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.bowlId',
          bowlName: { $first: '$items.bowlName' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'bowls',
          localField: '_id',
          foreignField: '_id',
          as: 'bowl'
        }
      },
      {
        $project: {
          _id: 0,
          bowlId: '$_id',
          bowlName: 1,
          image: { $ifNull: [{ $arrayElemAt: ['$bowl.image', 0] }, ''] },
          totalSold: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.json(rows);
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ success: false, message: 'Failed to get top products', error: error.message });
  }
};

/**
 * GET /api/admin/dashboard/recent-orders?limit=10
 */
exports.getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Fetch user info for each order
    const userIds = [...new Set(orders.map(o => o.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    res.json(orders.map(o => {
      const user = userMap[o.userId.toString()] || {};
      return {
        id: o._id,
        orderNumber: o.orderNumber,
        customerName: user.fullName || user.username || 'Unknown',
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt
      };
    }));
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get recent orders', error: error.message });
  }
};

// ═══════════════════════════════════════════
//  ADMIN ORDERS
// ═══════════════════════════════════════════

/**
 * GET /api/admin/orders
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Fetch user info
    const userIds = [...new Set(orders.map(o => o.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    res.json({
      orders: orders.map(o => {
        const user = userMap[o.userId.toString()] || {};
        return {
          ...o,
          id: o._id,
          customerName: user.fullName || user.username || 'Unknown'
        };
      }),
      total,
      totalPages: Math.ceil(total / limitNum),
      page: pageNum
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get orders', error: error.message });
  }
};

/**
 * PATCH /api/admin/orders/:id/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingProgress } = req.body;
    const validStatuses = ORDER_STATUSES;

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Valid: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;
    if (!canTransitionOrderStatus(previousStatus, status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot transition order from ${previousStatus} to ${status}`
      });
    }

    const statusChanged = previousStatus !== status;
    const requestedProgress = normalizeTrackingProgress(trackingProgress);
    const nextProgress = requestedProgress !== null ? requestedProgress : defaultProgressForStatus(status);
    const progressChanged = typeof nextProgress === 'number' && order.trackingProgress !== nextProgress;
    if (statusChanged) {
      order.status = status;
      order.statusHistory = order.statusHistory || [];
      if (order.statusHistory.length === 0) {
        order.statusHistory.push({
          status: previousStatus,
          changedAt: order.updatedAt || order.createdAt || new Date(),
          source: 'system'
        });
      }
      order.statusHistory.push({
        status,
        changedAt: new Date(),
        changedBy: req.user.id,
        source: 'admin'
      });
    }
    if (progressChanged) {
      order.trackingProgress = nextProgress;
      order.trackingUpdatedAt = new Date();
    } else if (statusChanged && !order.trackingUpdatedAt) {
      order.trackingUpdatedAt = new Date();
    }
    if (statusChanged || progressChanged) {
      await order.save();
    }

    // Log admin action
    await AdminAction.create({
      adminId: req.user.id,
      action: 'update_order_status',
      targetType: 'order',
      targetId: req.params.id,
      details: {
        previousStatus,
        newStatus: status,
        statusChanged,
        trackingProgress: order.trackingProgress,
        progressChanged
      }
    });

    // Send FCM push notification to all user devices (non-blocking)
    // Notify on status transitions and admin progress updates.
    if ((statusChanged && status !== 'pending') || (!statusChanged && progressChanged)) {
      try {
        const devices = await Device.find({ userId: order.userId, isActive: true }).select('fcmToken');
        const tokens = devices.map(d => d.fcmToken).filter(Boolean);

        if (tokens.length > 0) {
          const { title, body } = statusChanged
            ? getOrderStatusNotification(order.orderNumber, status)
            : getOrderProgressNotification(order.orderNumber, order.trackingProgress);
          await sendToMultipleTokens(tokens, title, body, {
            orderId: String(order._id),
            orderNumber: order.orderNumber,
            status: order.status,
            trackingProgress: order.trackingProgress,
            type: statusChanged ? 'order_status' : 'order_progress'
          });
        }
      } catch (fcmErr) {
        // FCM failure should NOT block the status update response
        console.error('FCM notification failed (non-blocking):', fcmErr.message);
      }
    }

    res.json({ success: true, message: `Order status updated to ${status}`, order: order.toJSON() });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
};

exports.getFcmHealth = async (req, res) => {
  try {
    const status = getFirebaseStatus();
    res.json({
      success: true,
      firebaseInitialized: status.initialized,
      projectId: status.projectId,
      hasServiceAccountJson: status.hasServiceAccountJson,
      hasServiceAccountPath: status.hasServiceAccountPath,
      hasGoogleApplicationCredentials: status.hasGoogleApplicationCredentials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      firebaseInitialized: false,
      message: 'Failed to initialize Firebase Admin',
      error: error.message
    });
  }
};

function normalizeTrackingProgress(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(number)));
}

function defaultProgressForStatus(status) {
  switch (status) {
    case 'pending':
      return 10;
    case 'confirmed':
      return 25;
    case 'preparing':
      return 50;
    case 'delivering':
      return 75;
    case 'completed':
      return 100;
    case 'cancelled':
      return 0;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════
//  ADMIN BOWLS CRUD
// ═══════════════════════════════════════════

/**
 * POST /api/admin/bowls — Tạo bowl mới
 */
exports.createBowl = async (req, res) => {
  try {
    const { id, name, description, price, calories, protein, carbs, fat, category, image, inStock, isFeatured } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: 'Name, price and category are required' });
    }

    const bowl = await Bowl.create({
      _id: id || undefined,
      name, description, price,
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      category,
      image: image || '',
      inStock: inStock !== false,
      isFeatured: isFeatured || false
    });

    res.status(201).json(bowl);
  } catch (error) {
    console.error('Create bowl error:', error);
    res.status(500).json({ success: false, message: 'Failed to create bowl', error: error.message });
  }
};

/**
 * PATCH /api/admin/bowls/:id — Cập nhật bowl
 */
exports.updateBowl = async (req, res) => {
  try {
    const updates = {};
    const allowed = ['name', 'description', 'price', 'calories', 'protein', 'carbs', 'fat', 'category', 'image', 'inStock', 'isFeatured'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const bowl = await Bowl.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!bowl) {
      return res.status(404).json({ success: false, message: 'Bowl not found' });
    }

    res.json(bowl);
  } catch (error) {
    console.error('Update bowl error:', error);
    res.status(500).json({ success: false, message: 'Failed to update bowl', error: error.message });
  }
};

/**
 * DELETE /api/admin/bowls/:id — Xóa bowl
 */
exports.deleteBowl = async (req, res) => {
  try {
    const bowl = await Bowl.findByIdAndDelete(req.params.id);

    if (!bowl) {
      return res.status(404).json({ success: false, message: 'Bowl not found' });
    }

    res.json({ success: true, message: 'Bowl deleted' });
  } catch (error) {
    console.error('Delete bowl error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete bowl', error: error.message });
  }
};

// ═══════════════════════════════════════════
//  ADMIN CUSTOMERS
// ═══════════════════════════════════════════

/**
 * GET /api/admin/customers
 */
exports.getCustomers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 }).lean();

    // Aggregate order stats per user
    const userIds = users.map(u => u._id);
    const orderStats = await Order.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: '$userId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      }
    ]);

    const statsMap = {};
    orderStats.forEach(s => { statsMap[s._id.toString()] = s; });

    res.json(users.map(u => {
      const stats = statsMap[u._id.toString()] || { totalOrders: 0, totalSpent: 0 };
      return {
        id: u._id,
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        address: u.address,
        role: u.role,
        createdAt: u.createdAt,
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent
      };
    }));
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, message: 'Failed to get customers', error: error.message });
  }
};

/**
 * GET /api/admin/customers/:id
 */
exports.getCustomerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      orders
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to get customer', error: error.message });
  }
};
/**
 * DELETE /api/admin/customers/:id
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Tuỳ chọn: Nếu muốn xoá luôn lịch sử mua hàng của khách này thì bỏ comment dòng dưới
    // await Order.deleteMany({ userId: req.params.id });

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete customer', error: error.message });
  }
};
