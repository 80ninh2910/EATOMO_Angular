/**
 * Script tạo thêm đơn hàng cancelled/pending/confirmed đa dạng cho MongoDB
 * Chạy: node seed/more_high_risk_orders.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/eatomo_db';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB:', uri);

  // Lấy user mới hoặc at_risk
  const users = await User.find({ role: 'user' }).limit(10);
  if (users.length === 0) throw new Error('Không tìm thấy user');

  const now = new Date();
  const bowls = [
    { bowlId: 'L1', bowlName: 'L1', unitPrice: 149900, quantity: 1, subtotal: 149900 },
    { bowlId: 'B2', bowlName: 'B2', unitPrice: 174900, quantity: 2, subtotal: 349800 },
    { bowlId: 'H3', bowlName: 'H3', unitPrice: 219900, quantity: 1, subtotal: 219900 }
  ];

  const notes = [
    'không nghe máy',
    'địa chỉ không rõ',
    'giao trễ',
    'khách không xác nhận',
    'ghi chú bất thường',
    'voucher không hợp lệ',
    'khách yêu cầu hủy',
    'chờ xác nhận lâu',
    'COD không thành công'
  ];

  const statuses = ['cancelled', 'pending', 'confirmed'];

  const orders = [];
  for (let i = 0; i < 40; i++) {
    const user = users[i % users.length];
    const createdAt = new Date(now.getTime() - (Math.random() * 6 + 2) * 3600 * 1000); // 2-8h trước
    orders.push({
      orderNumber: 'HRISKX' + (2000 + i),
      userId: user._id,
      status: statuses[i % statuses.length],
      items: [bowls[i % bowls.length]],
      subtotal: bowls[i % bowls.length].subtotal,
      tax: 0,
      shippingFee: 20000,
      discountAmount: 0,
      totalAmount: bowls[i % bowls.length].subtotal + 20000,
      paymentMethod: 'cash',
      paymentStatus: 'unpaid',
      deliveryAddress: 'Test address ' + i,
      deliveryPhone: '09000000' + i,
      deliveryNotes: notes[i % notes.length],
      voucherCode: i % 2 === 0 ? 'WELCOME10' : '',
      createdAt,
      updatedAt: createdAt
    });
  }

  await Order.insertMany(orders);
  console.log(`🎯 Đã thêm ${orders.length} đơn hàng cancelled/pending/confirmed.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
