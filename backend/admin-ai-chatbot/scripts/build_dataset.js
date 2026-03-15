const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const Order = require(path.join(__dirname, '..', '..', 'models', 'Order'));
const User = require(path.join(__dirname, '..', '..', 'models', 'User'));
const Bowl = require(path.join(__dirname, '..', '..', 'models', 'Bowl'));
const Voucher = require(path.join(__dirname, '..', '..', 'models', 'Voucher'));

const OUTPUT = {
  rawOrders: path.join(__dirname, '..', 'data', 'raw', 'real_orders.json'),
  syntheticOrders: path.join(__dirname, '..', 'data', 'synthetic', 'synthetic_orders.json'),
  processedJsonl: path.join(__dirname, '..', 'data', 'processed', 'orders_training_dataset.jsonl'),
  processedCsv: path.join(__dirname, '..', 'data', 'processed', 'orders_training_dataset.csv'),
  report: path.join(__dirname, '..', 'data', 'exports', 'dataset_report.json')
};

function parseSyntheticSize() {
  const arg = process.argv.find((a) => a.startsWith('--synthetic='));
  if (!arg) return 5000;
  const n = Number(arg.split('=')[1]);
  if (!Number.isFinite(n) || n < 100) return 5000;
  return Math.floor(n);
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function writeJsonl(filePath, rows) {
  ensureDir(filePath);
  const content = rows.map((r) => JSON.stringify(r)).join('\n');
  fs.writeFileSync(filePath, content + '\n', 'utf8');
}

function csvEscape(v) {
  const text = String(v ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function writeCsv(filePath, rows) {
  ensureDir(filePath);
  if (rows.length === 0) {
    fs.writeFileSync(filePath, '', 'utf8');
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

function weightedPick(weightMap) {
  const entries = Object.entries(weightMap).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0 || entries.length === 0) return null;
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function countBy(list, keyFn) {
  const counts = {};
  for (const item of list) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function buildWeightFromCounts(counts) {
  const weights = {};
  for (const [k, v] of Object.entries(counts)) {
    weights[k] = Number(v);
  }
  return weights;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function toIsoDay(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function daysAgoDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randomInt(8, 21), randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}

function buildUserStats(orders) {
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const stats = {};

  for (const o of orders) {
    const uid = String(o.userId);
    if (!stats[uid]) {
      stats[uid] = {
        orders90d: 0,
        spent90d: 0,
        lastOrderAt: null
      };
    }

    const createdAt = new Date(o.createdAt).getTime();
    if (now - createdAt <= ninetyDaysMs) {
      stats[uid].orders90d += 1;
      stats[uid].spent90d += Number(o.totalAmount || 0);
    }

    if (!stats[uid].lastOrderAt || createdAt > stats[uid].lastOrderAt) {
      stats[uid].lastOrderAt = createdAt;
    }
  }

  return stats;
}

function classifyUserSegment(stat, referenceTs = Date.now()) {
  if (!stat) return 'new';

  const orders90d = Number(stat.orders90d || 0);
  const spent90d = Number(stat.spent90d || 0);
  const daysSinceLast = stat.lastOrderAt
    ? Math.floor((referenceTs - stat.lastOrderAt) / (1000 * 60 * 60 * 24))
    : 999;

  if (orders90d >= 8 || spent90d >= 2500000) return 'vip';
  if (orders90d <= 1) return 'new';
  if (daysSinceLast >= 45 && orders90d <= 3) return 'at_risk';
  return 'regular';
}

function applyMultipliers(baseWeights, multipliers = {}) {
  const output = { ...baseWeights };
  for (const [k, m] of Object.entries(multipliers)) {
    if (output[k] !== undefined) {
      output[k] = Math.max(0.001, Number(output[k]) * Number(m));
    }
  }
  return output;
}

function getStatusWeightsByContext(segment, daysAgo, baseStatusWeights) {
  let base = { ...baseStatusWeights };
  if (daysAgo <= 2) {
    base = { pending: 22, confirmed: 20, preparing: 28, delivering: 20, completed: 8, cancelled: 2 };
  } else if (daysAgo <= 7) {
    base = { pending: 8, confirmed: 16, preparing: 22, delivering: 28, completed: 22, cancelled: 4 };
  }

  if (segment === 'new') {
    return applyMultipliers(base, { cancelled: 2.2, pending: 1.3, completed: 0.75 });
  }
  if (segment === 'vip') {
    return applyMultipliers(base, { cancelled: 0.55, pending: 0.8, completed: 1.35, delivering: 1.2 });
  }
  if (segment === 'at_risk') {
    return applyMultipliers(base, { cancelled: 2.8, pending: 1.5, preparing: 0.9, completed: 0.7 });
  }
  return base;
}

function getPaymentWeightsBySegment(segment, basePaymentWeights) {
  const base = { ...basePaymentWeights };
  if (segment === 'new') {
    return applyMultipliers(base, { cash: 1.45, momo: 1.1, card: 0.8, bank_transfer: 0.7 });
  }
  if (segment === 'vip') {
    return applyMultipliers(base, { cash: 0.7, momo: 1.25, card: 1.3, bank_transfer: 1.1 });
  }
  if (segment === 'at_risk') {
    return applyMultipliers(base, { cash: 1.4, momo: 1.05, card: 0.85, bank_transfer: 0.85 });
  }
  return base;
}

function getItemCountWeightsBySegment(segment, itemCountWeights) {
  const base = { ...itemCountWeights };
  if (segment === 'new') {
    return applyMultipliers(base, { '1': 1.35, '2': 1.15, '3': 0.8, '4': 0.65 });
  }
  if (segment === 'vip') {
    return applyMultipliers(base, { '1': 0.7, '2': 1.1, '3': 1.25, '4': 1.3 });
  }
  if (segment === 'at_risk') {
    return applyMultipliers(base, { '1': 1.25, '2': 1.1, '3': 0.85, '4': 0.7 });
  }
  return base;
}

function computeDiscount(voucher, subtotal) {
  if (!voucher) return 0;
  if (subtotal < (voucher.minOrderValue || 0)) return 0;

  let discount = 0;
  if (voucher.discountType === 'percentage') {
    discount = Math.round(subtotal * Number(voucher.discountValue || 0) / 100);
    if (voucher.maxDiscountAmount && discount > voucher.maxDiscountAmount) {
      discount = voucher.maxDiscountAmount;
    }
  } else {
    discount = Number(voucher.discountValue || 0);
  }
  return Math.max(0, discount);
}

function generateSyntheticOrders(params) {
  const {
    n,
    realOrders,
    users,
    bowls,
    vouchers,
    statusWeights,
    paymentMethodWeights,
    itemCountWeights,
    qtyWeights,
    categoryWeights,
    voucherCodeWeights
  } = params;

  const bowlsByCategory = {
    'low-cal': bowls.filter((b) => b.category === 'low-cal' && b.inStock !== false),
    balanced: bowls.filter((b) => b.category === 'balanced' && b.inStock !== false),
    'high-protein': bowls.filter((b) => b.category === 'high-protein' && b.inStock !== false),
    vegetarian: bowls.filter((b) => b.category === 'vegetarian' && b.inStock !== false)
  };

  const voucherByCode = Object.fromEntries(vouchers.map((v) => [String(v.code), v]));
  const userIds = users.filter((u) => u.role === 'user').map((u) => String(u._id));
  const realUserStats = buildUserStats(realOrders);
  const userWeights = {};
  const userSegments = {};
  const nowTs = Date.now();

  for (const uid of userIds) {
    const stat = realUserStats[uid] || { orders90d: 0, spent90d: 0, lastOrderAt: null };
    const seg = classifyUserSegment(stat, nowTs);
    userSegments[uid] = seg;

    let weight = Math.max(1, Number(stat.orders90d || 0));
    if (seg === 'vip') weight *= 1.8;
    if (seg === 'new') weight *= 1.1;
    if (seg === 'at_risk') weight *= 0.9;
    userWeights[uid] = weight;
  }

  const result = [];

  for (let i = 0; i < n; i += 1) {
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.8) * 365);
    const createdAt = daysAgoDate(daysAgo);

    const userId = weightedPick(userWeights) || randomChoice(userIds);
    const segment = userSegments[userId] || 'regular';

    const status = weightedPick(getStatusWeightsByContext(segment, daysAgo, statusWeights)) || 'completed';
    const paymentMethod = weightedPick(getPaymentWeightsBySegment(segment, paymentMethodWeights)) || 'cash';
    const itemCount = Number(weightedPick(getItemCountWeightsBySegment(segment, itemCountWeights)) || 2);

    const usedIds = new Set();
    const items = [];

    for (let j = 0; j < itemCount; j += 1) {
      const category = weightedPick(categoryWeights) || 'balanced';
      const candidates = bowlsByCategory[category].length > 0 ? bowlsByCategory[category] : bowls;

      let picked = randomChoice(candidates);
      let guard = 0;
      while (picked && usedIds.has(String(picked._id)) && guard < 8) {
        picked = randomChoice(candidates);
        guard += 1;
      }

      if (!picked) {
        picked = randomChoice(bowls);
      }

      usedIds.add(String(picked._id));

      const quantity = Number(weightedPick(qtyWeights) || 1);
      const unitPrice = Number(picked.price || 0);
      items.push({
        bowlId: String(picked._id),
        bowlName: String(picked.name || picked._id),
        unitPrice,
        quantity,
        subtotal: unitPrice * quantity,
        category: picked.category
      });
    }

    const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
    const tax = Math.round(subtotal * 0.08);
    const shippingFee = subtotal > 500000 ? 0 : 30000;

    let voucherCode = '';
    let discountAmount = 0;

    const baseVoucherUsageRate = realOrders.length > 0
      ? realOrders.filter((o) => o.voucherCode).length / realOrders.length
      : 0.35;

    let voucherUsageRate = baseVoucherUsageRate;
    if (segment === 'vip') voucherUsageRate = Math.min(0.8, baseVoucherUsageRate + 0.2);
    if (segment === 'new') voucherUsageRate = Math.min(0.75, baseVoucherUsageRate + 0.12);
    if (segment === 'at_risk') voucherUsageRate = Math.min(0.85, baseVoucherUsageRate + 0.18);

    if (Math.random() < voucherUsageRate) {
      const code = weightedPick(voucherCodeWeights);
      const voucher = voucherByCode[code];
      const discount = computeDiscount(voucher, subtotal);
      if (discount > 0) {
        voucherCode = code;
        discountAmount = discount;
      }
    }

    const totalAmount = Math.max(0, subtotal + tax + shippingFee - discountAmount);

    let paymentStatus = 'unpaid';
    if (status === 'completed' || status === 'delivering') {
      let paidRate = 0.88;
      if (segment === 'vip') paidRate = 0.94;
      if (segment === 'new') paidRate = 0.83;
      if (segment === 'at_risk') paidRate = 0.72;
      paymentStatus = Math.random() < paidRate ? 'paid' : 'unpaid';
    }
    if (status === 'cancelled') {
      const refundRate = paymentMethod === 'cash' ? 0.2 : 0.45;
      paymentStatus = Math.random() < refundRate ? 'refunded' : 'unpaid';
    }

    const orderNumber = `SYN-${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(createdAt.getDate()).padStart(2, '0')}-${String(i + 1).padStart(6, '0')}`;

    result.push({
      orderNumber,
      userId,
      status,
      items,
      subtotal,
      tax,
      shippingFee,
      discountAmount,
      totalAmount,
      paymentMethod,
      paymentStatus,
      voucherCode,
      userSegment: segment,
      createdAt: createdAt.toISOString()
    });
  }

  return result;
}

function toTrainingRow(order, userStats) {
  const createdAt = new Date(order.createdAt);
  const now = Date.now();
  const ageHours = Math.max(0, (now - createdAt.getTime()) / (1000 * 60 * 60));
  const totalQty = order.items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  const itemCount = order.items.length;
  const avgItemPrice = itemCount > 0 ? Math.round(order.subtotal / itemCount) : 0;

  const categories = { 'low-cal': 0, balanced: 0, 'high-protein': 0, vegetarian: 0 };
  for (const it of order.items) {
    const c = it.category || 'balanced';
    if (Object.prototype.hasOwnProperty.call(categories, c)) {
      categories[c] += Number(it.quantity || 0);
    }
  }

  const userId = String(order.userId);
  const user = userStats[userId] || { orders90d: 0, spent90d: 0, lastOrderAt: null };
  const userSegment = order.userSegment || classifyUserSegment(user, now);
  const userAvgOrder = user.orders90d > 0 ? user.spent90d / user.orders90d : 0;
  const userDaysSinceLast = user.lastOrderAt
    ? Math.floor((createdAt.getTime() - user.lastOrderAt) / (1000 * 60 * 60 * 24))
    : 999;

  const delayRisk = (
    (order.status === 'pending' && ageHours > 3) ||
    (order.status === 'confirmed' && ageHours > 2.5) ||
    (order.status === 'preparing' && ageHours > 2) ||
    (order.status === 'delivering' && ageHours > 5)
  ) ? 1 : 0;

  return {
    order_number: order.orderNumber,
    created_at: createdAt.toISOString(),
    created_day: toIsoDay(createdAt),
    weekday: createdAt.getDay(),
    hour_of_day: createdAt.getHours(),
    month: createdAt.getMonth() + 1,
    user_id: userId,
    user_segment: userSegment,
    user_orders_90d: user.orders90d,
    user_spent_90d: Math.round(user.spent90d),
    user_avg_order_value_90d: Math.round(userAvgOrder),
    user_days_since_last_order: userDaysSinceLast,
    item_count: itemCount,
    total_quantity: totalQty,
    subtotal: Math.round(order.subtotal),
    tax: Math.round(order.tax),
    shipping_fee: Math.round(order.shippingFee),
    discount_amount: Math.round(order.discountAmount),
    total_amount: Math.round(order.totalAmount),
    avg_item_price: avgItemPrice,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    has_voucher: order.voucherCode ? 1 : 0,
    voucher_code: order.voucherCode || '',
    qty_low_cal: categories['low-cal'],
    qty_balanced: categories.balanced,
    qty_high_protein: categories['high-protein'],
    qty_vegetarian: categories.vegetarian,
    current_status: order.status,
    age_hours: Number(ageHours.toFixed(2)),
    label_cancelled: order.status === 'cancelled' ? 1 : 0,
    label_delay_risk: delayRisk,
    label_payment_unpaid: order.paymentStatus === 'unpaid' ? 1 : 0
  };
}

async function main() {
  const syntheticSize = parseSyntheticSize();
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/eatomo_db';

  await mongoose.connect(uri);
  console.log(`[dataset] connected: ${uri}`);

  const [orders, users, bowls, vouchers] = await Promise.all([
    Order.find({}).lean(),
    User.find({}).lean(),
    Bowl.find({}).lean(),
    Voucher.find({ isActive: true }).lean()
  ]);

  if (orders.length === 0) {
    throw new Error('No real orders found. Run seed first.');
  }

  const bowlMap = Object.fromEntries(bowls.map((b) => [String(b._id), b]));
  const realUserStats = buildUserStats(orders);

  const statusWeights = buildWeightFromCounts(countBy(orders, (o) => o.status || 'unknown'));
  const paymentMethodWeights = buildWeightFromCounts(countBy(orders, (o) => o.paymentMethod || 'cash'));

  const itemCounts = orders.map((o) => (Array.isArray(o.items) ? o.items.length : 1));
  const itemCountWeights = buildWeightFromCounts(countBy(itemCounts, (n) => String(n)));

  const qtyList = [];
  const categoryList = [];
  for (const o of orders) {
    for (const it of (o.items || [])) {
      qtyList.push(Number(it.quantity || 1));
      const bowl = bowlMap[String(it.bowlId)];
      categoryList.push(bowl?.category || 'balanced');
    }
  }
  const qtyWeights = buildWeightFromCounts(countBy(qtyList, (n) => String(n)));
  const categoryWeights = buildWeightFromCounts(countBy(categoryList, (c) => c));

  const usedVoucherCodes = orders
    .map((o) => String(o.voucherCode || '').trim())
    .filter((v) => v.length > 0);

  const voucherCodeWeights = buildWeightFromCounts(countBy(usedVoucherCodes, (v) => v));
  for (const v of vouchers) {
    if (!voucherCodeWeights[v.code]) {
      voucherCodeWeights[v.code] = 1;
    }
  }

  const syntheticOrders = generateSyntheticOrders({
    n: syntheticSize,
    realOrders: orders,
    users,
    bowls,
    vouchers,
    statusWeights,
    paymentMethodWeights,
    itemCountWeights,
    qtyWeights,
    categoryWeights,
    voucherCodeWeights
  });

  const normalizedRealOrders = orders.map((o) => {
    const items = (o.items || []).map((it) => {
      const bowl = bowlMap[String(it.bowlId)];
      return {
        bowlId: String(it.bowlId),
        bowlName: it.bowlName,
        unitPrice: Number(it.unitPrice || 0),
        quantity: Number(it.quantity || 0),
        subtotal: Number(it.subtotal || 0),
        category: bowl?.category || 'balanced'
      };
    });

    const userId = String(o.userId);
    const userSegment = classifyUserSegment(realUserStats[userId], Date.now());

    return {
      orderNumber: o.orderNumber,
      userId,
      status: o.status,
      items,
      subtotal: Number(o.subtotal || 0),
      tax: Number(o.tax || 0),
      shippingFee: Number(o.shippingFee || 0),
      discountAmount: Number(o.discountAmount || 0),
      totalAmount: Number(o.totalAmount || 0),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      voucherCode: o.voucherCode || '',
      userSegment,
      createdAt: new Date(o.createdAt).toISOString()
    };
  });

  const allOrders = normalizedRealOrders.concat(syntheticOrders);
  const userStats = buildUserStats(allOrders);
  const trainingRows = allOrders.map((o) => toTrainingRow(o, userStats));

  writeJson(OUTPUT.rawOrders, normalizedRealOrders);
  writeJson(OUTPUT.syntheticOrders, syntheticOrders);
  writeJsonl(OUTPUT.processedJsonl, trainingRows);
  writeCsv(OUTPUT.processedCsv, trainingRows);

  const realStatus = countBy(normalizedRealOrders, (o) => o.status);
  const syntheticStatus = countBy(syntheticOrders, (o) => o.status);
  const mergedStatus = countBy(allOrders, (o) => o.status);
  const labelCancelRate = trainingRows.reduce((s, r) => s + r.label_cancelled, 0) / trainingRows.length;

  const report = {
    generatedAt: new Date().toISOString(),
    syntheticSize,
    realOrders: normalizedRealOrders.length,
    syntheticOrders: syntheticOrders.length,
    totalRows: trainingRows.length,
    distributions: {
      realStatus,
      syntheticStatus,
      mergedStatus,
      paymentMethod: countBy(allOrders, (o) => o.paymentMethod || 'unknown'),
      userSegment: countBy(trainingRows, (r) => r.user_segment || 'unknown')
    },
    labels: {
      cancelRate: Number(labelCancelRate.toFixed(4)),
      delayRiskRate: Number((trainingRows.reduce((s, r) => s + r.label_delay_risk, 0) / trainingRows.length).toFixed(4)),
      unpaidRate: Number((trainingRows.reduce((s, r) => s + r.label_payment_unpaid, 0) / trainingRows.length).toFixed(4))
    },
    outputFiles: OUTPUT
  };

  writeJson(OUTPUT.report, report);

  console.log('[dataset] done');
  console.log(`[dataset] real=${normalizedRealOrders.length}, synthetic=${syntheticOrders.length}, total=${trainingRows.length}`);
  console.log(`[dataset] cancel_rate=${report.labels.cancelRate}, delay_rate=${report.labels.delayRiskRate}`);
  console.log(`[dataset] report=${OUTPUT.report}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('[dataset] failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
