const path = require('path');

const Order = require('../models/Order');
const User = require('../models/User');
const AdminAction = require('../models/AdminAction');
const Bowl = require('../models/Bowl');

const runtime = require(path.join(__dirname, '..', 'admin-ai-chatbot', 'src', 'training', 'runtime'));

let cancelModel = null;
let delayModel = null;

const DEFAULT_METRIC_THRESHOLDS = {
  accuracy: 0.6,
  recall: 0.7
};

const DEFAULT_BOWL_IMAGE = '/assets/healthy/images/index/bowl-b2.jpg';

function resolveBowlImage(image) {
  const raw = String(image || '').trim();
  if (!raw) return DEFAULT_BOWL_IMAGE;
  if (raw.startsWith('http') || raw.startsWith('/')) return raw;
  if (raw.startsWith('assets/')) return `/${raw}`;
  if (raw.startsWith('../') || raw.startsWith('./')) {
    return `/${raw.replace(/^\.\//, '').replace(/^\.\.\//, '')}`;
  }
  return `/assets/healthy/images/index/${raw.replace(/^\/+/, '')}`;
}

function ensureModelsLoaded() {
  if (!cancelModel) cancelModel = runtime.loadModel('cancel');
  if (!delayModel) delayModel = runtime.loadModel('delay');
}

function segmentFromStats(stats) {
  const orders90d = Number(stats.orders90d || 0);
  const spent90d = Number(stats.spent90d || 0);
  const daysSinceLast = Number(stats.daysSinceLastOrder || 999);

  if (orders90d >= 8 || spent90d >= 2500000) return 'vip';
  if (orders90d <= 1) return 'new';
  if (daysSinceLast >= 45 && orders90d <= 3) return 'at_risk';
  return 'regular';
}

function buildCategoryQuantity(items) {
  const category = { lowCal: 0, balanced: 0, highProtein: 0, vegetarian: 0 };
  for (const it of items || []) {
    const q = Number(it.quantity || 0);
    const id = String(it.bowlId || '').toUpperCase();

    if (id.startsWith('L')) category.lowCal += q;
    else if (id.startsWith('B')) category.balanced += q;
    else if (id.startsWith('H')) category.highProtein += q;
    else if (id.startsWith('V')) category.vegetarian += q;
    else category.balanced += q;
  }
  return category;
}

function weekKey(dateLike) {
  const d = new Date(dateLike);
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function getUserWindowStats(userId, createdAt) {
  const refDate = new Date(createdAt || Date.now());
  const start = new Date(refDate.getTime() - 90 * 24 * 60 * 60 * 1000);

  const orders = await Order.find({
    userId,
    createdAt: { $gte: start, $lte: refDate }
  })
    .sort({ createdAt: -1 })
    .lean();

  const spent90d = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const latest = orders.length > 0 ? new Date(orders[0].createdAt).getTime() : null;
  const daysSinceLastOrder = latest
    ? Math.floor((refDate.getTime() - latest) / (1000 * 60 * 60 * 24))
    : 999;

  return {
    orders90d: orders.length,
    spent90d,
    daysSinceLastOrder,
    avgOrder90d: orders.length > 0 ? spent90d / orders.length : 0
  };
}

function orderToFeatures(order, userStats) {
  const created = new Date(order.createdAt || Date.now());
  const ageHours = Math.max(0, (Date.now() - created.getTime()) / (1000 * 60 * 60));
  const totalQty = (order.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0);
  const itemCount = Array.isArray(order.items) ? order.items.length : 0;
  const categoryQty = buildCategoryQuantity(order.items || []);

  return {
    payment_method: String(order.paymentMethod || 'cash'),
    user_segment: segmentFromStats(userStats),
    user_orders_90d: Number(userStats.orders90d || 0),
    user_spent_90d: Math.round(Number(userStats.spent90d || 0)),
    user_avg_order_value_90d: Math.round(Number(userStats.avgOrder90d || 0)),
    user_days_since_last_order: Number(userStats.daysSinceLastOrder || 999),
    item_count: itemCount,
    total_quantity: totalQty,
    subtotal: Math.round(Number(order.subtotal || 0)),
    tax: Math.round(Number(order.tax || 0)),
    shipping_fee: Math.round(Number(order.shippingFee || 0)),
    discount_amount: Math.round(Number(order.discountAmount || 0)),
    total_amount: Math.round(Number(order.totalAmount || 0)),
    avg_item_price: itemCount > 0 ? Math.round(Number(order.subtotal || 0) / itemCount) : 0,
    has_voucher: order.voucherCode ? 1 : 0,
    weekday: created.getDay(),
    hour_of_day: created.getHours(),
    month: created.getMonth() + 1,
    qty_low_cal: categoryQty.lowCal,
    qty_balanced: categoryQty.balanced,
    qty_high_protein: categoryQty.highProtein,
    qty_vegetarian: categoryQty.vegetarian,
    age_hours: Number(ageHours.toFixed(2))
  };
}

function classifyRiskLevel(pred) {
  if (pred.probability >= 0.7) return 'Cao';
  if (pred.probability >= 0.4) return 'Trung binh';
  return 'Thap';
}

function isDelayRiskTruth(order) {
  const ageHours = Math.max(0, (Date.now() - new Date(order.createdAt).getTime()) / 3600000);
  if (order.status === 'pending' && ageHours > 3) return 1;
  if (order.status === 'confirmed' && ageHours > 2.5) return 1;
  if (order.status === 'preparing' && ageHours > 2) return 1;
  if (order.status === 'delivering' && ageHours > 5) return 1;
  return 0;
}

function evaluateBinary(yTrue, yPred) {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (let i = 0; i < yTrue.length; i += 1) {
    const t = yTrue[i];
    const p = yPred[i];
    if (p === 1 && t === 1) tp += 1;
    else if (p === 1 && t === 0) fp += 1;
    else if (p === 0 && t === 0) tn += 1;
    else fn += 1;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = yTrue.length > 0 ? (tp + tn) / yTrue.length : 0;

  return {
    samples: yTrue.length,
    tp,
    fp,
    tn,
    fn,
    accuracy: Number(accuracy.toFixed(4)),
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4))
  };
}

function parseMetricThresholds(input = {}) {
  const accuracy = Number(input.accuracy);
  const recall = Number(input.recall);

  const safeAccuracy = Number.isFinite(accuracy)
    ? Math.min(1, Math.max(0, accuracy))
    : DEFAULT_METRIC_THRESHOLDS.accuracy;
  const safeRecall = Number.isFinite(recall)
    ? Math.min(1, Math.max(0, recall))
    : DEFAULT_METRIC_THRESHOLDS.recall;

  return {
    accuracy: safeAccuracy,
    recall: safeRecall
  };
}

function scoreColor(value, threshold) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return { color: 'gray', level: 'NO_DATA' };
  }
  if (n < threshold) {
    return { color: 'red', level: 'ALERT' };
  }
  if (n < threshold + 0.05) {
    return { color: 'amber', level: 'WATCH' };
  }
  return { color: 'green', level: 'OK' };
}

function buildMetricAlert(modelKey, metric, thresholds) {
  const accuracy = Number(metric?.accuracy);
  const recall = Number(metric?.recall);

  const accuracyState = scoreColor(accuracy, thresholds.accuracy);
  const recallState = scoreColor(recall, thresholds.recall);

  let overallColor = 'green';
  let overallLevel = 'OK';
  if (accuracyState.color === 'red' || recallState.color === 'red') {
    overallColor = 'red';
    overallLevel = 'ALERT';
  } else if (accuracyState.color === 'amber' || recallState.color === 'amber') {
    overallColor = 'amber';
    overallLevel = 'WATCH';
  }

  return {
    model: modelKey,
    overall: {
      color: overallColor,
      level: overallLevel
    },
    accuracy: {
      value: Number.isFinite(accuracy) ? Number(accuracy.toFixed(4)) : null,
      threshold: thresholds.accuracy,
      color: accuracyState.color,
      level: accuracyState.level
    },
    recall: {
      value: Number.isFinite(recall) ? Number(recall.toFixed(4)) : null,
      threshold: thresholds.recall,
      color: recallState.color,
      level: recallState.level
    }
  };
}

function buildOfflineValidationSnapshot(model) {
  const business = model?.metrics?.business || null;
  const f1Optimal = model?.metrics?.f1Optimal || null;

  return {
    business,
    f1Optimal,
    threshold: Number(model?.threshold ?? 0)
  };
}

function calcDriftScore(model, rows) {
  const numeric = model?.featureConfig?.numeric || [];
  const means = model?.standardization?.mean || [];
  const stds = model?.standardization?.std || [];

  if (numeric.length === 0 || rows.length === 0) return { score: 0, topShiftedFeatures: [] };

  const shifts = [];
  for (let i = 0; i < numeric.length; i += 1) {
    const feature = numeric[i];
    const rowMean = rows.reduce((s, r) => s + Number(r[feature] || 0), 0) / rows.length;
    const baselineMean = Number(means[i] || 0);
    const baselineStd = Number(stds[i] || 1) || 1;
    const z = Math.abs((rowMean - baselineMean) / baselineStd);
    shifts.push({ feature, zShift: Number(z.toFixed(4)) });
  }

  shifts.sort((a, b) => b.zShift - a.zShift);
  const score = shifts.reduce((s, x) => s + x.zShift, 0) / shifts.length;

  return {
    score: Number(score.toFixed(4)),
    topShiftedFeatures: shifts.slice(0, 8)
  };
}

function buildAdminAnswer(question, cancelRisk, delayRisk) {
  const cancelLevel = classifyRiskLevel(cancelRisk);
  const delayLevel = classifyRiskLevel(delayRisk);

  const actions = [];
  const quickActions = [];

  if (cancelRisk.label === 1) {
    actions.push('Goi khach xac nhan lai nhu cau va phuong thuc thanh toan ngay.');
  }
  if (delayRisk.label === 1) {
    actions.push('Day uu tien don trong bep va bo tri tai xe giao som.');
  }

  if (cancelRisk.label === 1 || delayRisk.label === 1) {
    quickActions.push({
      type: 'route',
      label: 'Loc don rui ro cao',
      route: '/admin',
      queryParams: { risk: 'high' }
    });
  }

  if (actions.length === 0) {
    actions.push('Don dang o muc an toan. Theo doi them sau 30-45 phut.');
  }

  return {
    intent: 'admin_order_risk_assessment',
    answer:
      `Danh gia: rui ro huy don ${cancelLevel} (${(cancelRisk.probability * 100).toFixed(1)}%), ` +
      `rui ro tre SLA ${delayLevel} (${(delayRisk.probability * 100).toFixed(1)}%). ` +
      `De xuat: ${actions.join(' ')}`,
    question: String(question || ''),
    recommendations: actions,
    quickActions
  };
}

function formatProbability(probability) {
  const p = Number(probability);
  if (!Number.isFinite(p)) return 0;
  return Math.min(1, Math.max(0, p));
}

function toPct(probability) {
  return Number((formatProbability(probability) * 100).toFixed(1));
}

function computePriorityBand(cancelRisk, delayRisk) {
  const maxRisk = Math.max(formatProbability(cancelRisk.probability), formatProbability(delayRisk.probability));
  if (maxRisk >= 0.85) return 'P0_KHAN_CAP';
  if (maxRisk >= 0.7) return 'P1_CAO';
  if (maxRisk >= 0.5) return 'P2_THEO_DOI_SAT';
  return 'P3_BINH_THUONG';
}

function buildRiskReasons(order, features, cancelRisk, delayRisk) {
  const reasons = [];
  const ageHours = Number(features?.age_hours || 0);
  const hasVoucher = Number(features?.has_voucher || 0) === 1;
  const paymentMethod = String(order?.paymentMethod || 'cash');
  const segment = String(features?.user_segment || 'regular');

  if (ageHours >= 2.5) reasons.push(`Don da ton dong ${ageHours.toFixed(1)} gio trong he thong.`);
  if (cancelRisk.probability >= 0.7) reasons.push('Xac suat huy don cao vuot nguong canh bao.');
  if (delayRisk.probability >= 0.7) reasons.push('Xac suat tre SLA cao, can uu tien dieu phoi.');
  if (hasVoucher) reasons.push('Don su dung voucher, can xac nhan dung han va dieu kien ap dung.');
  if (paymentMethod === 'cash') reasons.push('Thanh toan tien mat thuong can buoc xac nhan lai voi khach.');
  if (segment === 'new' || segment === 'at_risk') reasons.push('Nhom khach can cham soc sat hon de giam nguy co huy.');

  if (reasons.length === 0) {
    reasons.push('Khong co dau hieu bat thuong lon, tiep tuc theo doi dinh ky.');
  }

  return reasons.slice(0, 5);
}

function buildOrderActionPlan(order, cancelRisk, delayRisk) {
  const plan = [];

  if (cancelRisk.probability >= 0.6) {
    plan.push('Trong 10 phut: goi xac nhan don va thoi gian nhan hang voi khach.');
    plan.push('Kiem tra thanh toan, voucher va ghi chu giao hang de tranh sai thong tin.');
  }

  if (delayRisk.probability >= 0.6) {
    plan.push('Day uu tien don len dau hang doi bep, cap nhat ETA moi cho khach.');
    plan.push('Dieu phoi tai xe du phong neu don dang co nguy co tre SLA.');
  }

  if (plan.length === 0) {
    plan.push('Duy tri quy trinh binh thuong, cap nhat trang thai don moi 30-45 phut.');
    plan.push('Neu don tang rui ro, chuyen sang luong xu ly uu tien ngay.');
  }

  plan.push(`Theo doi den khi don chuyen sang completed/cancelled (hien tai: ${String(order.status || 'unknown')}).`);

  return plan.slice(0, 5);
}

function summarizeTopItems(items) {
  return (items || [])
    .map((it) => ({
      bowlName: String(it.bowlName || 'Khong ro ten mon'),
      quantity: Number(it.quantity || 0),
      subtotal: Math.round(Number(it.subtotal || 0))
    }))
    .sort((a, b) => b.quantity - a.quantity || b.subtotal - a.subtotal)
    .slice(0, 3);
}

function buildOrderDetailedAnalysis(order, features, cancelRisk, delayRisk) {
  const ageHours = Number(features?.age_hours || 0);
  const cancelProb = formatProbability(cancelRisk.probability);
  const delayProb = formatProbability(delayRisk.probability);
  const maxRisk = Math.max(cancelProb, delayProb);
  const estimatedDelayMinutes = delayProb < 0.35
    ? 0
    : Math.min(240, Math.round((delayProb * 120) + (ageHours * 12)));

  const slaStatus = estimatedDelayMinutes >= 90
    ? 'critical'
    : estimatedDelayMinutes >= 30
      ? 'watch'
      : 'normal';

  const topItems = summarizeTopItems(order.items);
  const totalQuantity = (order.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0);

  return {
    generatedAt: new Date().toISOString(),
    order: {
      orderId: String(order._id),
      orderNumber: String(order.orderNumber || ''),
      status: String(order.status || ''),
      createdAt: order.createdAt,
      ageHours: Number(ageHours.toFixed(2)),
      paymentMethod: String(order.paymentMethod || 'cash'),
      paymentStatus: String(order.paymentStatus || 'unpaid'),
      totalAmount: Math.round(Number(order.totalAmount || 0)),
      subtotal: Math.round(Number(order.subtotal || 0)),
      shippingFee: Math.round(Number(order.shippingFee || 0)),
      discountAmount: Math.round(Number(order.discountAmount || 0)),
      itemCount: Array.isArray(order.items) ? order.items.length : 0,
      totalQuantity,
      hasVoucher: Boolean(order.voucherCode),
      voucherCode: String(order.voucherCode || ''),
      topItems
    },
    risk: {
      cancel: {
        probability: toPct(cancelProb),
        level: classifyRiskLevel({ probability: cancelProb }),
        threshold: toPct(cancelRisk.threshold),
        label: Number(cancelRisk.label || 0),
        thresholdGap: Number((cancelProb - formatProbability(cancelRisk.threshold)).toFixed(4))
      },
      delay: {
        probability: toPct(delayProb),
        level: classifyRiskLevel({ probability: delayProb }),
        threshold: toPct(delayRisk.threshold),
        label: Number(delayRisk.label || 0),
        thresholdGap: Number((delayProb - formatProbability(delayRisk.threshold)).toFixed(4))
      },
      combinedScore: Number((maxRisk * 100).toFixed(1)),
      priorityBand: computePriorityBand(cancelRisk, delayRisk)
    },
    sla: {
      status: slaStatus,
      estimatedDelayMinutes,
      escalationInMinutes: maxRisk >= 0.7 ? 10 : 25,
      reason: slaStatus === 'critical'
        ? 'Nguy co tre SLA cao, can dieu phoi ngay.'
        : slaStatus === 'watch'
          ? 'Can theo doi sat va cap nhat ETA chu dong.'
          : 'Chua thay nguy co tre SLA dang ke.'
    },
    riskReasons: buildRiskReasons(order, features, cancelRisk, delayRisk),
    actionPlan: buildOrderActionPlan(order, cancelRisk, delayRisk),
    featureSnapshot: {
      userSegment: String(features?.user_segment || 'regular'),
      userOrders90d: Number(features?.user_orders_90d || 0),
      userSpent90d: Math.round(Number(features?.user_spent_90d || 0)),
      avgOrderValue90d: Math.round(Number(features?.user_avg_order_value_90d || 0)),
      qtyLowCal: Number(features?.qty_low_cal || 0),
      qtyBalanced: Number(features?.qty_balanced || 0),
      qtyHighProtein: Number(features?.qty_high_protein || 0),
      qtyVegetarian: Number(features?.qty_vegetarian || 0)
    }
  };
}

function buildSmartPrompts(cancelRisk, delayRisk) {
  const prompts = [
    'Top 3 don can uu tien xu ly trong 2 gio toi?',
    'Goi y quy trinh giam huy don cho don rui ro cao.',
    'Neu bi tre SLA, toi nen dieu phoi nguon luc nhu the nao?'
  ];

  if (cancelRisk.probability >= 0.6) {
    prompts.unshift('Hay tao checklist goi dien xac nhan khach cho don nay.');
  }

  if (delayRisk.probability >= 0.5) {
    prompts.unshift('Uoc tinh thoi gian giao moi va cach cap nhat cho khach.');
  }

  return prompts.slice(0, 4);
}

function normalizePromptKey(question) {
  return normalizeQuestion(question)
    .replace(/\border[\s_-]*id\b/g, 'orderid')
    .replace(/\bk[\s._-]*p[\s._-]*i\b/g, 'kpi')
    .replace(/\bsl[4a]\b/g, 'sla')
    .replace(/\bdoanhthu\b/g, 'doanh thu')
    .replace(/\bloinhuan\b/g, 'loi nhuan')
    .replace(/\bhuydon\b/g, 'huy don')
    .replace(/\bdonhuy\b/g, 'don huy')
    .replace(/\bdontre\b/g, 'don tre')
    .replace(/\bbanchay\b/g, 'ban chay')
    .replace(/\be\s*nhat\b/g, 'e nhat')
    .replace(/\buuu+\s*tien\b/g, 'uu tien')
    .replace(/\bgoi\s+y\b/g, 'goi y')
    .replace(/[?.!,;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const INTENT_KEYWORD_PROFILES = {
  top_priority: [
    'top 3', 'uu tien', '2 gio toi', 'xu ly gap', 'checklist 30 phut', 'don tre nao can day uu tien'
  ],
  cancel_process: [
    'giam huy don', 'quy trinh', 'script goi khach', 'giu don', 'ty le huy', 'can thiep'
  ],
  sla_dispatch: [
    'tre sla', 'dieu phoi', 'tai xe', 'eta', 'uoc tinh', 'giao moi'
  ],
  monitoring: [
    'monitoring', 'drift', 'accuracy', 'precision', 'recall', 'f1', 'mo hinh'
  ],
  action_summary: [
    'hanh dong admin', 'nhat ky admin', 'audit admin', '24 gio qua'
  ],
  high_risk_summary: [
    'rui ro cao', 'nguy co huy cao nhat', 'can review'
  ],
  order_required: [
    'orderid', 'danh gia rui ro theo orderid', 'don nay'
  ],
  product_sales: [
    'top 5 mon', 'ban chay nhat', 'mon nao ban chay nhat', 'top mon e nhat', 'mon e nhat', 'ế nhất', "ế"
  ],
  dashboard: [
    'dashboard', 'bao cao', 'doanh thu', 'loi nhuan', 'kpi', 'don tre', 'don huy'
  ]
};

function detectIntentByKeywordScore(promptKey) {
  if (!promptKey) return null;

  let bestIntent = null;
  let bestScore = 0;
  let secondScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORD_PROFILES)) {
    let score = 0;
    for (const kw of keywords) {
      if (promptKey.includes(kw)) {
        score += kw.includes(' ') ? 1.4 : 1;
      }
    }

    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestIntent = intent;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  if (!bestIntent) return null;

  const confident = bestScore >= 2 || (bestScore >= 1.4 && (bestScore - secondScore) >= 0.8);
  return confident ? bestIntent : null;
}

function promptTokens(text) {
  return normalizePromptKey(text)
    .split(' ')
    .map((x) => x.trim())
    .filter((x) => x.length >= 2);
}

function levenshteinDistance(a, b) {
  const s1 = String(a || '');
  const s2 = String(b || '');
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function normalizedEditSimilarity(a, b) {
  const s1 = String(a || '');
  const s2 = String(b || '');
  if (!s1 && !s2) return 1;
  const maxLen = Math.max(s1.length, s2.length) || 1;
  const dist = levenshteinDistance(s1, s2);
  return 1 - (dist / maxLen);
}

function tokenSimilarity(a, b) {
  const t1 = promptTokens(a);
  const t2 = promptTokens(b);
  if (t1.length === 0 || t2.length === 0) return { jaccard: 0, overlapCount: 0, coverage: 0 };

  const s1 = new Set(t1);
  const s2 = new Set(t2);
  let overlapCount = 0;
  for (const token of s1) {
    if (s2.has(token)) overlapCount += 1;
  }

  const union = new Set([...s1, ...s2]).size || 1;
  const jaccard = overlapCount / union;
  const coverage = overlapCount / Math.max(1, Math.min(s1.size, s2.size));
  return { jaccard, overlapCount, coverage };
}

function fuzzyFindKey(promptKey, dictionary) {
  const keys = Object.keys(dictionary || {});
  if (!promptKey || keys.length === 0) return null;

  let bestKey = null;
  let bestScore = -1;

  for (const key of keys) {
    const token = tokenSimilarity(promptKey, key);
    const edit = normalizedEditSimilarity(promptKey, key);
    const score = (token.jaccard * 0.55) + (token.coverage * 0.25) + (edit * 0.20);

    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  if (!bestKey) return null;

  const bestToken = tokenSimilarity(promptKey, bestKey);
  const bestEdit = normalizedEditSimilarity(promptKey, bestKey);
  const accept =
    bestScore >= 0.62 ||
    (bestToken.overlapCount >= 3 && bestScore >= 0.55) ||
    (bestEdit >= 0.9 && bestScore >= 0.5);

  return accept ? bestKey : null;
}

const EXACT_PROMPT_INTENT_MAP = {
  'top 3 don can uu tien xu ly trong 2 gio toi': 'top_priority',
  'goi y quy trinh giam huy don cho don rui ro cao': 'cancel_process',
  'neu bi tre sla toi nen dieu phoi nguon luc nhu the nao': 'sla_dispatch',
  'so sanh doanh thu 7 ngay gan nhat voi 7 ngay truoc': 'dashboard',
  'top nguyen nhan gay tre don va cach xu ly nhanh': 'dashboard',
  'de xuat ke hoach giam ty le huy trong tuan toi': 'cancel_process',
  'voi don #1 toi nen goi khach theo script nao': 'cancel_process',
  'cho toi checklist 30 phut xu ly don tre': 'top_priority',
  'kpi nao can theo doi de giam huy don trong 2 gio toi': 'cancel_process',
  'soan script goi khach cho don nguy co huy cao': 'cancel_process',
  'don nao can uu dai giu don ngay bay gio': 'cancel_process',
  'ty le huy 24h qua thay doi the nao sau can thiep': 'cancel_process',
  'tao bang uu tien don theo 30 phut tiep theo': 'sla_dispatch',
  'uoc tinh so don co nguy co tre trong 2 gio toi': 'sla_dispatch',
  'can them bao nhieu tai xe de giam tre sla': 'sla_dispatch',
  'cho toi weekly precision/recall 4 tuan gan nhat': 'monitoring',
  'drift feature nao dang lech manh nhat': 'monitoring',
  'de xuat nguong canh bao moi cho don tre sla': 'monitoring',
  'cho toi 3 don nguy co huy cao nhat': 'high_risk_summary',
  'don nao tre sla can day uu tien ngay': 'top_priority',
  'tom tat hanh dong can lam trong 60 phut toi': 'top_priority',
  'tom tat kpi van hanh hom nay': 'dashboard',
  'don nao can uu tien xu ly ngay': 'top_priority',
  'ty le huy don dang tang hay giam': 'dashboard',
  'cho toi bao cao doanh thu va loi nhuan 30 ngay': 'dashboard',
  'don tre hien tai bao nhieu phan tram': 'dashboard',
  'kiem tra canh bao tre sla hom nay': 'sla_dispatch',
  'tom tat xu huong doanh thu 7 ngay gan nhat': 'dashboard',
  'cho toi dashboard kpi lien quan den voucher': 'dashboard',
  'phan tich nguyen nhan don tre tang trong 7 ngay qua': 'dashboard',
  'uu tien xu ly don nao de giam huy don': 'cancel_process',
  'tom tat cac hanh dong admin 24 gio qua': 'action_summary',
  'don nao dang o muc rui ro cao can review': 'high_risk_summary',
  'cho toi bao cao tong quan kpi va canh bao': 'dashboard',
  'cho toi bao cao 30 ngay moi nhat': 'dashboard',
  'don tre nao can uu tien': 'top_priority',
  'ty le huy don hien tai la bao nhieu': 'dashboard',
  'bao cao dashboard doanh thu 30 ngay': 'dashboard',
  'thong ke don tre don huy hien tai': 'dashboard',
  'thong ke don tre va don huy hien tai': 'dashboard',
  'cho toi dashboard doanh thu 30 ngay': 'dashboard',
  'thong ke top 5 mon duoc ban chay nhat': 'product_sales',
  'top 5 mon duoc ban chay nhat': 'product_sales',
  'mon nao ban chay nhat': 'product_sales',
  'top nhung mon e nhat': 'product_sales',
  'top mon e nhat': 'product_sales',
  'voi orderid nay hay danh gia rui ro cho toi': 'order_required',
  'danh gia rui ro theo orderid cho don nay': 'order_required'
};

const DASHBOARD_VIEW_BY_PROMPT = {
  'so sanh doanh thu 7 ngay gan nhat voi 7 ngay truoc': 'revenue_compare_7d',
  'top nguyen nhan gay tre don va cach xu ly nhanh': 'delay_root_cause',
  'tom tat kpi van hanh hom nay': 'kpi_daily_summary',
  'ty le huy don dang tang hay giam': 'cancel_rate',
  'cho toi bao cao doanh thu va loi nhuan 30 ngay': 'revenue_profit_30d',
  'don tre hien tai bao nhieu phan tram': 'delay_rate',
  'tom tat xu huong doanh thu 7 ngay gan nhat': 'revenue_trend_7d',
  'cho toi dashboard kpi lien quan den voucher': 'voucher_kpi',
  'phan tich nguyen nhan don tre tang trong 7 ngay qua': 'delay_root_cause',
  'cho toi bao cao tong quan kpi va canh bao': 'kpi_alert',
  'cho toi bao cao 30 ngay moi nhat': 'kpi_overview_30d',
  'ty le huy don hien tai la bao nhieu': 'cancel_rate',
  'bao cao dashboard doanh thu 30 ngay': 'revenue_30d',
  'thong ke don tre don huy hien tai': 'delay_cancel_snapshot',
  'thong ke don tre va don huy hien tai': 'delay_cancel_snapshot',
  'cho toi dashboard doanh thu 30 ngay': 'revenue_30d'
};

const PRODUCT_SALES_VIEW_BY_PROMPT = {
  'thong ke top 5 mon duoc ban chay nhat': 'top_selling_5',
  'top 5 mon duoc ban chay nhat': 'top_selling_5',
  'mon nao ban chay nhat': 'best_seller',
  'top nhung mon e nhat': 'slowest_selling_5',
  'top mon e nhat': 'slowest_selling_5'
};

function detectDashboardView(question) {
  const key = normalizePromptKey(question);
  const direct = DASHBOARD_VIEW_BY_PROMPT[key];
  if (direct) return direct;

  const fuzzyKey = fuzzyFindKey(key, DASHBOARD_VIEW_BY_PROMPT);
  return fuzzyKey ? DASHBOARD_VIEW_BY_PROMPT[fuzzyKey] : 'kpi_overview_30d';
}

function detectProductSalesView(question) {
  const key = normalizePromptKey(question);
  const direct = PRODUCT_SALES_VIEW_BY_PROMPT[key];
  if (direct) return direct;

  const fuzzyKey = fuzzyFindKey(key, PRODUCT_SALES_VIEW_BY_PROMPT);
  return fuzzyKey ? PRODUCT_SALES_VIEW_BY_PROMPT[fuzzyKey] : 'top_selling_5';
}

function detectPromptIntent(question) {
  const q = normalizeQuestion(question);
  if (!q) return null;

  const promptKey = normalizePromptKey(question);
  if (Object.prototype.hasOwnProperty.call(EXACT_PROMPT_INTENT_MAP, promptKey)) {
    return EXACT_PROMPT_INTENT_MAP[promptKey];
  }

  const fuzzyKey = fuzzyFindKey(promptKey, EXACT_PROMPT_INTENT_MAP);
  if (fuzzyKey) {
    return EXACT_PROMPT_INTENT_MAP[fuzzyKey];
  }

  const keywordIntent = detectIntentByKeywordScore(promptKey);
  if (keywordIntent) {
    return keywordIntent;
  }

  const topPriority = [
    /top\s*3\s*don/,
    /uu\s*tien\s*xu\s*ly/,
    /don\s*nao\s*can\s*uu\s*tien/,
    /bang\s*uu\s*tien\s*don/,
    /checklist\s*30\s*phut\s*xu\s*ly\s*don\s*tre/,
    /tom\s*tat\s*hanh\s*dong\s*can\s*lam\s*trong\s*60\s*phut/,
    /don\s*tre\s*nao\s*can\s*day\s*uu\s*tien/
  ];

  const cancelProcess = [
    /quy\s*trinh\s*giam\s*huy\s*don/,
    /giam\s*huy\s*don/,
    /script\s*goi\s*khach/,
    /voi\s*don\s*#?1\s*toi\s*nen\s*goi\s*khach\s*theo\s*script\s*nao/,
    /checklist\s*goi\s*dien\s*xac\s*nhan\s*khach/,
    /uu\s*dai\s*giu\s*don/,
    /kpi\s*nao\s*can\s*theo\s*doi\s*de\s*giam\s*huy\s*don/,
    /de\s*xuat\s*ke\s*hoach\s*giam\s*ty\s*le\s*huy\s*trong\s*tuan\s*toi/,
    /ty\s*le\s*huy\s*24h\s*qua\s*thay\s*doi\s*the\s*nao\s*sau\s*can\s*thiep/
  ];

  const slaDispatch = [
    /tre\s*sla/,
    /dieu\s*phoi\s*nguon\s*luc/,
    /dieu\s*phoi\s*bep/,
    /dieu\s*phoi\s*tai\s*xe/,
    /uoc\s*tinh\s*thoi\s*gian\s*giao\s*moi/,
    /uoc\s*tinh\s*so\s*don\s*co\s*nguy\s*co\s*tre\s*trong\s*2\s*gio\s*toi/,
    /can\s*them\s*bao\s*nhieu\s*tai\s*xe\s*de\s*giam\s*tre\s*sla/
  ];

  const monitoring = [
    /monitoring/,
    /accuracy/,
    /drift/,
    /precision/,
    /recall/,
    /f1/,
    /weekly\s*precision\s*\/\s*recall/,
    /drift\s*feature\s*nao\s*dang\s*lech\s*manh\s*nhat/,
    /nguong\s*canh\s*bao\s*moi\s*cho\s*don\s*tre\s*sla/
  ];

  const dashboard = [
    /dashboard/,
    /bao\s*cao/,
    /doanh\s*thu/,
    /loi\s*nhuan/,
    /kpi/,
    /so\s*sanh\s*doanh\s*thu\s*7\s*ngay\s*gan\s*nhat\s*voi\s*7\s*ngay\s*truoc/,
    /top\s*nguyen\s*nhan\s*gay\s*tre\s*don/,
    /xu\s*huong\s*doanh\s*thu\s*7\s*ngay\s*gan\s*nhat/,
    /bao\s*cao\s*tong\s*quan\s*kpi\s*va\s*canh\s*bao/
  ];

  const actionSummary = [
    /tom\s*tat\s*cac\s*hanh\s*dong\s*admin\s*24\s*gio\s*qua/,
    /hanh\s*dong\s*admin\s*24\s*gio/,
    /nhat\s*ky\s*admin/,
    /audit\s*admin/
  ];

  const highRiskSummary = [
    /cho\s*toi\s*3\s*don\s*nguy\s*co\s*huy\s*cao\s*nhat/,
    /don\s*nao\s*dang\s*o\s*muc\s*rui\s*ro\s*cao\s*can\s*review/
  ];

  const orderRequired = [
    /danh\s*gia\s*rui\s*ro\s*theo\s*orderid/,
    /voi\s*orderid\s*nay\s*hay\s*danh\s*gia\s*rui\s*ro/
  ];

  const productSales = [
    /top\s*5\s*mon\s*(duoc\s*)?ban\s*chay\s*nhat/,
    /mon\s*nao\s*ban\s*chay\s*nhat/,
    /top\s*(nhung\s*)?mon\s*e\s*nhat/
  ];

  if (topPriority.some((p) => p.test(q))) return 'top_priority';
  if (cancelProcess.some((p) => p.test(q))) return 'cancel_process';
  if (slaDispatch.some((p) => p.test(q))) return 'sla_dispatch';
  if (monitoring.some((p) => p.test(q))) return 'monitoring';
  if (actionSummary.some((p) => p.test(q))) return 'action_summary';
  if (highRiskSummary.some((p) => p.test(q))) return 'high_risk_summary';
  if (orderRequired.some((p) => p.test(q))) return 'order_required';
  if (productSales.some((p) => p.test(q))) return 'product_sales';
  if (dashboard.some((p) => p.test(q))) return 'dashboard';

  return null;
}

function isDashboardReportQuestion(question) {
  const q = normalizeQuestion(question);
  if (!q) return false;

  const keywords = [
    'dashboard',
    'bao cao',
    'doanh thu',
    'loi nhuan',
    'don tre',
    'tre don',
    'tre sla',
    'don huy',
    'huy don',
    'kpi'
  ];

  return keywords.some((k) => q.includes(k));
}

function delayThresholdHours(status) {
  if (status === 'pending') return 3;
  if (status === 'confirmed') return 2.5;
  if (status === 'preparing') return 2;
  if (status === 'delivering') return 5;
  return Number.POSITIVE_INFINITY;
}

function ymd(dateLike) {
  const d = new Date(dateLike);
  return d.toISOString().slice(0, 10);
}

function resolveDashboardLookbackDays(dashboardView = 'kpi_overview_30d') {
  const sevenDayViews = new Set(['revenue_compare_7d', 'revenue_trend_7d']);
  if (sevenDayViews.has(dashboardView)) return 7;
  return 30;
}

async function buildDashboardReport(dashboardView = 'kpi_overview_30d') {
  const now = new Date();
  const lookbackDays = resolveDashboardLookbackDays(dashboardView);
  const last30 = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const prev30 = new Date(now.getTime() - (lookbackDays * 2) * 24 * 60 * 60 * 1000);
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [stats30] = await Order.aggregate([
    { $match: { createdAt: { $gte: last30 } } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        cancelledOrders: {
          $sum: {
            $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
          }
        }
      }
    }
  ]);

  const [statsPrev30] = await Order.aggregate([
    { $match: { createdAt: { $gte: prev30, $lt: last30 }, status: { $ne: 'cancelled' } } },
    { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
  ]);

  const statusAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: last30 } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const revenueAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: last7 }, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const activeOrders = await Order.find({ status: { $in: ['pending', 'confirmed', 'preparing', 'delivering'] } })
    .select('status createdAt')
    .lean();

  let delayedOrders = 0;
  const nowTs = Date.now();
  for (const order of activeOrders) {
    const ageHours = Math.max(0, (nowTs - new Date(order.createdAt).getTime()) / 3600000);
    if (ageHours > delayThresholdHours(order.status)) delayedOrders += 1;
  }

  const totalOrders = Number(stats30?.totalOrders || 0);
  const totalRevenue = Math.round(Number(stats30?.totalRevenue || 0));
  const cancelledOrders = Number(stats30?.cancelledOrders || 0);
  const netOrders = Math.max(1, totalOrders - cancelledOrders);
  const avgOrderValue = Math.round(totalRevenue / netOrders);
  const prevRevenue = Number(statsPrev30?.revenue || 0);
  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const cancelRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
  const delayedRate = activeOrders.length > 0 ? (delayedOrders / activeOrders.length) * 100 : 0;
  const grossProfitEstimate = Math.round(totalRevenue * 0.32);

  const revenueMap = new Map(revenueAgg.map((r) => [r._id, r]));
  const revenueSeries = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = ymd(d);
    const row = revenueMap.get(key);
    revenueSeries.push({
      label: key,
      revenue: Math.round(Number(row?.revenue || 0)),
      orders: Number(row?.orders || 0)
    });
  }

  return {
    type: 'dashboard_overview',
    period: `${lookbackDays}d`,
    generatedAt: new Date().toISOString(),
    kpis: {
      totalRevenue,
      grossProfitEstimate,
      totalOrders,
      avgOrderValue,
      revenueGrowth: Number(revenueGrowth.toFixed(2)),
      cancelRate: Number(cancelRate.toFixed(2)),
      delayedOrders,
      delayedRate: Number(delayedRate.toFixed(2))
    },
    orderStatus: statusAgg.map((x) => ({ status: x._id, count: x.count })),
    revenueSeries
  };
}

function buildDashboardAnswer(report, dashboardView = 'kpi_overview_30d') {
  const level = report.kpis.cancelRate >= 20 || report.kpis.delayedRate >= 30 ? 'can canh bao' : 'on dinh';
  const latestRevenue = Number(report.revenueSeries?.[report.revenueSeries.length - 1]?.revenue || 0);
  const earliestRevenue = Number(report.revenueSeries?.[0]?.revenue || 0);
  const trend = latestRevenue - earliestRevenue;
  const periodDays = Number.parseInt(String(report?.period || '30d').replace(/[^0-9]/g, ''), 10) || 30;
  const periodLabel = `${periodDays} ngay`;

  const recommendationsByView = {
    revenue_compare_7d: [
      'Theo doi ngay co doanh thu giam manh de bo sung khuyen mai nhanh.',
      'Ket hop du lieu tre SLA de loai tru anh huong van hanh len doanh thu.',
      'Dat muc canh bao khi doanh thu ngay giam > 15%.'
    ],
    delay_root_cause: [
      'Uu tien xu ly don pending/preparing co age cao truoc.',
      'Tach line bep cho nhom mon nhanh vao khung gio cao diem.',
      'Canh bao som cho dieu phòi khi ty le tre SLA vuot nguong.'
    ],
    kpi_daily_summary: [
      'Kiem tra KPI dau ngay va cuoi ngay de phat hien dao chieu som.',
      'Giu cancel rate duoi nguong canh bao trong khung gio cao diem.',
      'Doi chieu doanh thu voi so don de danh gia chat luong chuyen doi.'
    ],
    cancel_rate: [
      'Uu tien goi xac nhan don gia tri cao trong 10 phut dau.',
      'Theo doi cac don co nguy co huy > 60% de can thiep som.',
      'Danh gia lai script tu van khi cancel rate tang dot bien.'
    ],
    revenue_profit_30d: [
      'Tap trung nhom san pham co bien loi nhuan cao va ty le huy thap.',
      'Kiem tra ngay doanh thu thap de toi uu campaign theo khung gio.',
      'So sanh doanh thu voi KPI delay/cancel de giam that thoat loi nhuan.'
    ],
    delay_rate: [
      'Chia ca bep/tai xe theo khung gio co nguy co tre cao.',
      'Uu tien don gan nguong SLA truoc khi vuot muc.',
      'Thong bao ETA chu dong de giam phan hoi tieu cuc.'
    ],
    revenue_trend_7d: [
      'Danh dau ngay tang/giam manh de toi uu hang ton va nhan su.',
      'Dung trend 7 ngay de dieu chinh muc khuyen mai ngan han.',
      'Canh bao neu doanh thu giam lien tiep 2 ngay.'
    ],
    voucher_kpi: [
      'Hien tai dashboard chua tach rieng KPI voucher, can bo sung tracking voucherCode.',
      'Tam thoi doi chieu doanh thu va cancel rate de danh gia hieu qua voucher gian tiep.',
      'De xuat them chi so conversion voucher theo nhom khach.'
    ],
    kpi_alert: [
      'Neu cancel rate hoac delay rate vuot nguong, kich hoat quy trinh canh bao khan.',
      'Bo tri lai nang luc bep/tai xe theo muc do canh bao.',
      'Review nhanh top don rui ro cao moi 30 phut.'
    ],
    kpi_overview_30d: [
      'Theo doi nhom don pending/preparing qua 2 gio de can thiep som.',
      'Uu tien lien he xac nhan don co gia tri cao de giam huy don.',
      'Kiem tra dashboard chi tiet de doi chieu trend theo ngay.'
    ],
    revenue_30d: [
      'Theo doi doanh thu theo ngay de phat hien su suy giam som.',
      'Doi chieu doanh thu voi so don de danh gia chat luong don hang.',
      'Ket hop voi dashboard risk de uu tien don gia tri cao.'
    ],
    delay_cancel_snapshot: [
      'Kiem soat dong thoi 2 KPI: don tre va don huy trong cung khung gio.',
      'Uu tien nhom don vua co nguy co tre vua co nguy co huy cao.',
      'Cap nhat trang thai don lien tuc de AI du bao sat hon.'
    ]
  };

  const answersByView = {
    revenue_compare_7d:
      `So sanh 7 ngay: doanh thu ngay dau ${earliestRevenue.toLocaleString('vi-VN')} VND, ` +
      `ngay gan nhat ${latestRevenue.toLocaleString('vi-VN')} VND, chenhlech ${trend.toLocaleString('vi-VN')} VND.`,
    delay_root_cause:
      `Phan tich tre don: hien co ${report.kpis.delayedOrders} don tre (${report.kpis.delayedRate.toFixed(1)}%). ` +
      'Nguyen nhan uu tien can xu ly la nhom pending/preparing qua nguong SLA va dieu phòi giao van khong can bang.',
    kpi_daily_summary:
      `Tom tat KPI van hanh: doanh thu ${periodLabel} ${report.kpis.totalRevenue.toLocaleString('vi-VN')} VND, ` +
      `AOV ${report.kpis.avgOrderValue.toLocaleString('vi-VN')} VND, huy ${report.kpis.cancelRate.toFixed(1)}%, tre ${report.kpis.delayedRate.toFixed(1)}%.`,
    cancel_rate: `Ti le huy hien tai la ${report.kpis.cancelRate.toFixed(1)}% tren tap don ${periodLabel}, muc he thong dang ${level}.`,
    revenue_profit_30d:
      `Bao cao doanh thu-loi nhuan ${periodLabel}: doanh thu ${report.kpis.totalRevenue.toLocaleString('vi-VN')} VND, ` +
      `loi nhuan uoc tinh ${report.kpis.grossProfitEstimate.toLocaleString('vi-VN')} VND, tang truong ${report.kpis.revenueGrowth.toFixed(1)}%.`,
    delay_rate: `Ty le don tre hien tai la ${report.kpis.delayedRate.toFixed(1)}% voi ${report.kpis.delayedOrders} don dang tre SLA.`,
    revenue_trend_7d:
      `Xu huong doanh thu 7 ngay: moc dau ${earliestRevenue.toLocaleString('vi-VN')} VND, moc cuoi ${latestRevenue.toLocaleString('vi-VN')} VND, xu huong ${trend >= 0 ? 'tang' : 'giam'}.`,
    voucher_kpi:
      `Dashboard KPI voucher: he thong chua co KPI voucher tach rieng trong report hien tai. ` +
      `Co the tham chieu tam doanh thu ${report.kpis.totalRevenue.toLocaleString('vi-VN')} VND va ty le huy ${report.kpis.cancelRate.toFixed(1)}%.`,
    kpi_alert:
      `Tong quan canh bao KPI: huy ${report.kpis.cancelRate.toFixed(1)}%, tre ${report.kpis.delayedRate.toFixed(1)}%, trang thai ${level}. ` +
      'Neu mot trong hai KPI tang nhanh, can kich hoat xu ly khan.',
    kpi_overview_30d:
      `Bao cao ${periodLabel}: Doanh thu ${report.kpis.totalRevenue.toLocaleString('vi-VN')} VND, ` +
      `loi nhuan uoc tinh ${report.kpis.grossProfitEstimate.toLocaleString('vi-VN')} VND, ` +
      `don tre ${report.kpis.delayedOrders} (${report.kpis.delayedRate.toFixed(1)}%), ` +
      `ti le huy ${report.kpis.cancelRate.toFixed(1)}%. Trang thai he thong: ${level}.`,
    revenue_30d: `Dashboard doanh thu ${periodLabel}: tong doanh thu ${report.kpis.totalRevenue.toLocaleString('vi-VN')} VND, tang truong ${report.kpis.revenueGrowth.toFixed(1)}% so voi ky truoc.`,
    delay_cancel_snapshot:
      `Thong ke nhanh tre/huy: don tre ${report.kpis.delayedOrders} (${report.kpis.delayedRate.toFixed(1)}%), ` +
      `ty le huy ${report.kpis.cancelRate.toFixed(1)}%, muc canh bao ${level}.`
  };

  return {
    intent: 'admin_dashboard_report',
    dashboardView,
    answer: answersByView[dashboardView] || answersByView.kpi_overview_30d,
    recommendations: recommendationsByView[dashboardView] || recommendationsByView.kpi_overview_30d,
    quickActions: [
      {
        type: 'route',
        label: 'Mo trang Bao cao Admin',
        route: '/admin/report'
      },
      {
        type: 'route',
        label: 'Loc don rui ro cao',
        route: '/admin',
        queryParams: { risk: 'high' }
      }
    ],
    smartPrompts: [
      'So sanh doanh thu 7 ngay gan nhat voi 7 ngay truoc.',
      'Thong ke don tre va don huy hien tai.',
      'Cho toi bao cao tong quan KPI va canh bao.'
    ]
  };
}

function uniqPrompts(list, limit = 6) {
  return Array.from(new Set((list || []).map((x) => String(x || '').trim()).filter(Boolean))).slice(0, limit);
}

function extractOrderReference(question) {
  const raw = String(question || '');
  if (!raw) return null;

  const objectIdMatch = raw.match(/\b[a-fA-F0-9]{24}\b/);
  if (objectIdMatch) {
    return { type: 'objectId', value: objectIdMatch[0] };
  }

  const orderNoMatch = raw.match(/\bORD[-_ ]?\d{4,}[-_ ]?\d{1,6}\b/i);
  if (orderNoMatch) {
    return { type: 'orderNumber', value: orderNoMatch[0].replace(/[_ ]/g, '-') };
  }

  return null;
}

async function resolveOrderFromReference(ref) {
  if (!ref?.value) return null;

  if (ref.type === 'objectId') {
    return Order.findById(ref.value).lean();
  }

  return Order.findOne({ orderNumber: new RegExp(`^${String(ref.value)}$`, 'i') }).lean();
}

function isModelMonitoringQuestion(question) {
  const q = normalizeQuestion(question);
  return /(monitoring|drift|precision|recall|f1|model|mo hinh|mohinh|hieu nang|hieu suat)/.test(q);
}

function isHighRiskListQuestion(question) {
  const q = normalizeQuestion(question);
  return /(top don|don rui ro|rui ro cao|uu tien don|can xu ly gap|canh bao don|3 don nguy co huy cao nhat)/.test(q);
}

function isTopPriorityPrompt(question) {
  const q = normalizeQuestion(question);
  return /(top\s*3\s*don|top\s*3\s*don\s*can\s*uu\s*tien|2\s*gio\s*toi|uu\s*tien\s*xu\s*ly)/.test(q);
}

function isCancelProcessPrompt(question) {
  const q = normalizeQuestion(question);
  return /(quy\s*trinh\s*giam\s*huy\s*don|giam\s*huy\s*don|huy\s*don\s*cho\s*don\s*rui\s*ro\s*cao)/.test(q);
}

function isSlaDispatchPrompt(question) {
  const q = normalizeQuestion(question);
  return /(tre\s*sla|dieu\s*phoi\s*nguon\s*luc|dieu\s*phoi\s*bep|dieu\s*phoi\s*tai\s*xe)/.test(q);
}

function statusWeight(status) {
  if (status === 'pending') return 1.35;
  if (status === 'confirmed') return 1.2;
  if (status === 'preparing') return 1.1;
  if (status === 'delivering') return 1.05;
  return 1;
}

async function buildOperationalRiskQueue(limit = 6) {
  const orders = await Order.find({ status: { $in: ['pending', 'confirmed', 'preparing', 'delivering'] } })
    .sort({ createdAt: 1 })
    .limit(160)
    .lean();

  const out = [];
  const now = Date.now();

  const asSafeProbability = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  };

  for (const order of orders) {
    const { cancelRisk, delayRisk } = await getPredictionForOrder(order);
    const cancelProb = asSafeProbability(cancelRisk?.probability);
    const delayProb = asSafeProbability(delayRisk?.probability);
    const ageHours = Math.max(0, (now - new Date(order.createdAt).getTime()) / 3600000);
    const urgency = Math.max(cancelProb, delayProb) * statusWeight(order.status) + Math.min(ageHours / 10, 0.4);
    out.push({
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      status: order.status,
      cancelRisk: cancelProb,
      delayRisk: delayProb,
      ageHours: Number(ageHours.toFixed(2)),
      urgencyScore: Number(urgency.toFixed(6))
    });
  }

  out.sort((a, b) => b.urgencyScore - a.urgencyScore);
  return out.slice(0, limit);
}

async function buildTopPriorityPlan() {
  const top3 = await buildOperationalRiskQueue(3);

  const answer = top3.length === 0
    ? 'Hien khong co don dang xu ly de xep hang uu tien trong 2 gio toi.'
    : `Top 3 don can uu tien trong 2 gio toi: ${top3.map((x, i) => `${i + 1}) ${x.orderNumber} [${x.status}] - Huy ${(x.cancelRisk * 100).toFixed(0)}%, Tre ${(x.delayRisk * 100).toFixed(0)}%, Tuoi don ${x.ageHours.toFixed(1)}h`).join(' | ')}.`;

  return {
    intent: 'admin_priority_top3',
    answer,
    recommendations: [
      'Xu ly don #1 trong 15 phut dau: xac nhan khach + khoa slot bep.',
      'Don #2 va #3: day uu tien mon nhanh hoan tat truoc.',
      'Cap nhat trang thai moi 20 phut de AI cap nhat xep hang.'
    ],
    quickActions: [
      { type: 'route', label: 'Loc don rui ro cao', route: '/admin', queryParams: { risk: 'high' } }
    ],
    smartPrompts: [
      'Voi don #1, toi nen goi khach theo script nao?',
      'Cho toi checklist 30 phut xu ly don tre.',
      'KPI nao can theo doi de giam huy don trong 2 gio toi?'
    ],
    highRiskOrders: top3
  };
}

async function buildCancelReductionProcess() {
  const top = await buildOperationalRiskQueue(5);
  const risky = top.filter((x) => x.cancelRisk >= 0.55).length;

  return {
    intent: 'admin_cancel_reduction_process',
    answer: `Quy trinh giam huy don cho nhom rui ro cao: Phat hien som -> Xac nhan khach trong 10 phut -> Khoa nang luc bep/tai xe -> Cap nhat ETA chu dong. Hien co ${risky}/${top.length} don uu tien co nguy co huy >= 55%.`,
    recommendations: [
      'B1 (0-10 phut): goi xac nhan nhu cau va dia chi giao.',
      'B2 (10-25 phut): uu tien prep cho don co tong tien cao.',
      'B3 (25-45 phut): gui ETA moi va uu dai nho neu co tre.',
      'B4: neu khach do du -> doi phuong thuc thanh toan/doi khung gio de giu don.'
    ],
    quickActions: [
      { type: 'route', label: 'Loc don rui ro cao', route: '/admin', queryParams: { risk: 'high' } },
      { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' }
    ],
    smartPrompts: [
      'Soan script goi khach cho don nguy co huy cao.',
      'Don nao can uu dai giu don ngay bay gio?',
      'Ty le huy 24h qua thay doi the nao sau can thiep?'
    ]
  };
}

async function buildSlaDispatchPlan() {
  const top = await buildOperationalRiskQueue(6);
  const delayCritical = top.filter((x) => x.delayRisk >= 0.55);

  const brief = delayCritical.slice(0, 3)
    .map((x, i) => `${i + 1}) ${x.orderNumber} [${x.status}] Tre ${(x.delayRisk * 100).toFixed(0)}% (${x.ageHours.toFixed(1)}h)`)
    .join(' | ');

  return {
    intent: 'admin_sla_dispatch_plan',
    answer: delayCritical.length > 0
      ? `Ke hoach dieu phoi SLA: tap trung ${delayCritical.length} don nguy co tre cao. Uu tien ngay: ${brief}.`
      : 'Hien khong co don tre SLA o muc can dieu phoi khan cap.',
    recommendations: [
      'Nhom bep: tach line mon nhanh cho don dang pending/confirmed.',
      'Nhom giao: re-assign tai xe cho don co ageHours cao.',
      'Dieu do: cap nhat ETA moi va thong bao chu dong cho khach.'
    ],
    quickActions: [
      { type: 'route', label: 'Loc don rui ro cao', route: '/admin', queryParams: { risk: 'high' } }
    ],
    smartPrompts: [
      'Tao bang uu tien don theo 30 phut tiep theo.',
      'Uoc tinh so don co nguy co tre trong 2 gio toi.',
      'Can them bao nhieu tai xe de giam tre SLA?'
    ],
    highRiskOrders: delayCritical.slice(0, 5)
  };
}

async function buildMonitoringSnapshot() {
  const since = new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000);
  const orders = await Order.find({ createdAt: { $gte: since } }).sort({ createdAt: 1 }).lean();

  const weekly = {};
  const featureRows = [];

  for (const o of orders) {
    const { features, cancelRisk, delayRisk } = await getPredictionForOrder(o);
    featureRows.push(features);
    const wk = weekKey(o.createdAt);

    if (!weekly[wk]) {
      weekly[wk] = {
        cancelTrue: [],
        cancelPred: [],
        delayTrue: [],
        delayPred: []
      };
    }

    weekly[wk].cancelTrue.push(o.status === 'cancelled' ? 1 : 0);
    weekly[wk].cancelPred.push(cancelRisk.label);
    weekly[wk].delayTrue.push(isDelayRiskTruth(o));
    weekly[wk].delayPred.push(delayRisk.label);
  }

  const weeklyMetrics = Object.entries(weekly)
    .map(([week, item]) => ({
      week,
      cancel: evaluateBinary(item.cancelTrue, item.cancelPred),
      delay: evaluateBinary(item.delayTrue, item.delayPred)
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  const latest = weeklyMetrics.length > 0 ? weeklyMetrics[weeklyMetrics.length - 1] : null;
  const cancelDrift = calcDriftScore(cancelModel, featureRows);
  const delayDrift = calcDriftScore(delayModel, featureRows);

  const metricSummary = (metric) => {
    const hasTruePositiveClass = Number(metric?.tp || 0) + Number(metric?.fn || 0) > 0;
    const hasPredPositiveClass = Number(metric?.tp || 0) + Number(metric?.fp || 0) > 0;

    if (!hasTruePositiveClass && !hasPredPositiveClass) {
      return 'N/A (thieu mau positive va model khong phat canh bao)';
    }

    if (!hasTruePositiveClass) {
      return 'N/A (tuan nay khong co nhan positive trong du lieu)';
    }

    if (!hasPredPositiveClass) {
      return 'N/A (model khong du doan positive trong tuan nay)';
    }

    return `${(Number(metric.accuracy || 0) * 100).toFixed(1)}%/${(metric.precision * 100).toFixed(1)}%/${(metric.recall * 100).toFixed(1)}%/${(metric.f1 * 100).toFixed(1)}%`;
  };

  const metricCounts = (metric) => `TP=${metric.tp}, FP=${metric.fp}, FN=${metric.fn}, TN=${metric.tn}`;

  const offlineValidation = {
    cancel: buildOfflineValidationSnapshot(cancelModel),
    delay: buildOfflineValidationSnapshot(delayModel)
  };

  const metricThresholds = parseMetricThresholds();
  const metricAlerts = {
    cancel: buildMetricAlert('cancel', offlineValidation.cancel.business, metricThresholds),
    delay: buildMetricAlert('delay', offlineValidation.delay.business, metricThresholds)
  };

  return {
    intent: 'admin_model_monitoring',
    answer: latest
      ? `Monitoring model tuan ${latest.week}: Cancel A/P/R/F1 = ${metricSummary(latest.cancel)} (${metricCounts(latest.cancel)}), Delay A/P/R/F1 = ${metricSummary(latest.delay)} (${metricCounts(latest.delay)}). Drift cancel=${cancelDrift.score}, drift delay=${delayDrift.score}.`
      : 'Chua du du lieu de tinh monitoring model theo tuan.',
    recommendations: [
      'Neu drift > 1.0 trong nhieu tuan, nen retrain model.',
      'Theo doi dong thoi accuracy va recall de can bang chat luong canh bao.',
      'Kiem tra quality du lieu dau vao truoc khi cap nhat threshold.'
    ],
    quickActions: [
      { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' }
    ],
    smartPrompts: [
      'Cho toi weekly accuracy/precision/recall 4 tuan gan nhat.',
      'Drift feature nao dang lech manh nhat?',
      'De xuat nguong canh bao moi cho don tre SLA.'
    ],
    metricAlerts,
    monitoring: {
      generatedAt: new Date().toISOString(),
      drift: { cancel: cancelDrift, delay: delayDrift },
      latestWeekly: latest,
      offlineValidation,
      metricThresholds,
      metricAlerts
    }
  };
}

async function buildHighRiskSummary(limit = 5) {
  const orders = await Order.find({ status: { $in: ['pending', 'confirmed', 'preparing', 'delivering'] } })
    .sort({ createdAt: -1 })
    .limit(120)
    .lean();

  const scored = [];
  for (const order of orders) {
    const { cancelRisk, delayRisk } = await getPredictionForOrder(order);
    scored.push({
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      status: order.status,
      cancelRisk: cancelRisk.probability,
      delayRisk: delayRisk.probability,
      riskScore: Math.max(cancelRisk.probability, delayRisk.probability)
    });
  }

  scored.sort((a, b) => b.riskScore - a.riskScore);
  const top = scored.slice(0, limit);

  const short = top
    .map((x, i) => `${i + 1}) ${x.orderNumber} [${x.status}] - Huy ${(x.cancelRisk * 100).toFixed(0)}%, Tre ${(x.delayRisk * 100).toFixed(0)}%`)
    .join(' | ');

  return {
    intent: 'admin_high_risk_summary',
    answer: top.length > 0
      ? `Top ${top.length} don rui ro cao: ${short}`
      : 'Khong co don dang xu ly de tong hop rui ro.',
    recommendations: [
      'Uu tien goi xac nhan cac don co nguy co huy > 60%.',
      'Dieu phòi bep/tai xe cho nhom don delay > 50%.',
      'Cap nhat trang thai don lien tuc de AI du doan sat hon.'
    ],
    quickActions: [
      { type: 'route', label: 'Loc don rui ro cao', route: '/admin', queryParams: { risk: 'high' } }
    ],
    smartPrompts: [
      'Cho toi 3 don nguy co huy cao nhat.',
      'Don nao tre SLA can day uu tien ngay?',
      'Tom tat hanh dong can lam trong 60 phut toi.'
    ],
    highRiskOrders: top
  };
}

async function buildAdminActionSummary() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const actions = await AdminAction.find({ createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const grouped = {};
  for (const a of actions) {
    const key = String(a.action || 'unknown');
    grouped[key] = (grouped[key] || 0) + 1;
  }

  const topActions = Object.entries(grouped)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const brief = topActions.map((x) => `${x.action}: ${x.count}`).join(' | ');

  return {
    intent: 'admin_action_summary',
    answer: actions.length > 0
      ? `24 gio qua co ${actions.length} hanh dong admin duoc ghi nhan. Nhom hanh dong noi bat: ${brief}.`
      : '24 gio qua chua ghi nhan hanh dong admin nao trong he thong log.',
    recommendations: [
      'Ra soat cac hanh dong cap nhat don co tan suat cao de toi uu quy trinh.',
      'Kiem tra feedback AI de xac dinh nhom cau hoi can cai thien.',
      'Duy tri audit dinh ky cho cac hanh dong quan trong cua admin.'
    ],
    quickActions: [
      { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' }
    ],
    smartPrompts: [
      'Cho toi weekly precision/recall 4 tuan gan nhat.',
      'Top 3 don can uu tien xu ly trong 2 gio toi?',
      'Thong ke don tre, don huy hien tai.'
    ],
    actionSummary: {
      since: since.toISOString(),
      totalActions: actions.length,
      topActions
    }
  };
}

async function buildProductSalesAnswer(productView = 'top_selling_5') {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: since },
        status: { $ne: 'cancelled' }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          bowlId: '$items.bowlId',
          bowlName: '$items.bowlName'
        },
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' },
        lineCount: { $sum: 1 }
      }
    }
  ]);

  const normalized = rows
    .map((x) => ({
      bowlId: String(x._id?.bowlId || ''),
      bowlName: String(x._id?.bowlName || 'Khong ro ten mon'),
      totalQuantity: Number(x.totalQuantity || 0),
      totalRevenue: Math.round(Number(x.totalRevenue || 0)),
      lineCount: Number(x.lineCount || 0)
    }))
    .filter((x) => x.totalQuantity > 0);

  const bowlIds = normalized.map((x) => x.bowlId).filter(Boolean);
  const bowls = bowlIds.length > 0
    ? await Bowl.find({ _id: { $in: bowlIds } }).select('_id image').lean()
    : [];
  const bowlImageById = new Map(bowls.map((b) => [String(b._id), resolveBowlImage(b.image)]));

  const normalizedWithImage = normalized.map((x) => ({
    ...x,
    image: bowlImageById.get(x.bowlId) || DEFAULT_BOWL_IMAGE
  }));

  const byMost = [...normalizedWithImage].sort((a, b) => b.totalQuantity - a.totalQuantity || b.totalRevenue - a.totalRevenue);
  const byLeast = [...normalizedWithImage].sort((a, b) => a.totalQuantity - b.totalQuantity || a.totalRevenue - b.totalRevenue);

  const topSelling = byMost.slice(0, 5);
  const bestSeller = topSelling[0] || null;
  const slowestSelling = byLeast.slice(0, 5);

  const answerByView = {
    top_selling_5: topSelling.length > 0
      ? `Top 5 mon ban chay 30 ngay: ${topSelling.map((x, i) => `${i + 1}) ${x.bowlName} (${x.totalQuantity} phan)`).join(' | ')}.`
      : 'Chua co du lieu don hang hop le de thong ke top 5 mon ban chay.',
    best_seller: bestSeller
      ? `Mon ban chay nhat 30 ngay qua la ${bestSeller.bowlName} voi ${bestSeller.totalQuantity} phan, doanh thu ${bestSeller.totalRevenue.toLocaleString('vi-VN')} VND.`
      : 'Chua xac dinh duoc mon ban chay nhat vi thieu du lieu don hang.',
    slowest_selling_5: slowestSelling.length > 0
      ? `Top mon ban cham (e nhat) 30 ngay: ${slowestSelling.map((x, i) => `${i + 1}) ${x.bowlName} (${x.totalQuantity} phan)`).join(' | ')}.`
      : 'Chua co du lieu de tong hop nhom mon ban cham.'
  };

  const recommendationsByView = {
    top_selling_5: [
      'Dam bao ton kho nguyen lieu cho cac mon top trong khung gio cao diem.',
      'Dat mon top vao vi tri uu tien tren giao dien de tang conversion.',
      'Kiem tra bien loi nhuan cua tung mon top de toi uu combo.'
    ],
    best_seller: [
      'Nhan rong mon ban chay nhat bang bien the combo va upsell.',
      'Theo doi nguy co out-of-stock de tranh mat don.',
      'Doi chieu danh gia khach hang de giu chat luong mon top.'
    ],
    slowest_selling_5: [
      'Kiem tra gia va mo ta mon e de cai thien ty le chon mon.',
      'Can nhac gom mon e vao combo khuyen mai ngan han.',
      'Neu mon e lien tuc nhieu chu ky, de xuat tinh gon menu.'
    ]
  };

  const totalRevenueAll = normalizedWithImage.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);
  const totalQuantityAll = normalizedWithImage.reduce((sum, item) => sum + Number(item.totalQuantity || 0), 0);

  const topRevenue = topSelling.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);
  const topQuantity = topSelling.reduce((sum, item) => sum + Number(item.totalQuantity || 0), 0);
  const slowRevenue = slowestSelling.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);
  const slowQuantity = slowestSelling.reduce((sum, item) => sum + Number(item.totalQuantity || 0), 0);

  const gapRevenue = Math.max(0, topRevenue - slowRevenue);
  const gapQuantity = Math.max(0, topQuantity - slowQuantity);

  const bestRevenueShare = totalRevenueAll > 0 && bestSeller
    ? (Number(bestSeller.totalRevenue || 0) / totalRevenueAll) * 100
    : 0;
  const bestQuantityShare = totalQuantityAll > 0 && bestSeller
    ? (Number(bestSeller.totalQuantity || 0) / totalQuantityAll) * 100
    : 0;

  const slowestNames = slowestSelling.slice(0, 3).map((item) => item.bowlName).join(', ');
  const topNames = topSelling.slice(0, 3).map((item) => item.bowlName).join(', ');

  const dynamicMarketingStrategiesByView = {
    top_selling_5: [
      `Top nhom mon (${topNames || 'N/A'}) dang vuot nhom ban cham ${gapQuantity} phan va ${gapRevenue.toLocaleString('vi-VN')} VND. Nen uu tien banner/homepage cho nhom nay trong gio cao diem.`,
      `Top 5 hien dong gop ${totalRevenueAll > 0 ? ((topRevenue / totalRevenueAll) * 100).toFixed(1) : '0.0'}% doanh thu menu. Goi y tao combo top-item + do uong de tang AOV ngay tren nhom dang co traction.`,
      `Remarketing cho tap khach da mua ${topNames || 'mon top'} trong 30 ngay qua, uu tien thong diep quay lai trong 7 ngay de toi da hoa tan suat mua lap.`
    ],
    best_seller: [
      `${bestSeller ? bestSeller.bowlName : 'Mon top'} dang chiem ${bestRevenueShare.toFixed(1)}% doanh thu va ${bestQuantityShare.toFixed(1)}% san luong. Nen dung mon nay lam "anchor" cho chien dich signature theo tuan.`,
      `Kich hoat upsell theo cap voi ${bestSeller ? bestSeller.bowlName : 'mon top'} (topping + drink) vi mon nay da co nhu cau on dinh, kha nang cai thien bien loi nhuan se cao hon.`,
      `Neu doanh thu nhom mon cham (${slowestNames || 'N/A'}) thap hon nhom top ${gapRevenue.toLocaleString('vi-VN')} VND, nen cap traffic tu best seller sang nhom nay bang combo goi kem co uu dai nho.`
    ],
    slowest_selling_5: [
      `Nhom ban cham (${slowestNames || 'N/A'}) dang thua nhom top ${gapQuantity} phan trong 30 ngay. Nen chay mini-campaign theo khung gio vang de kich hoat trial.`,
      `Doanh thu nhom ban cham hien kem ${gapRevenue.toLocaleString('vi-VN')} VND so voi nhom top. Uu tien bundle mon cham voi 1 mon top (${topNames || 'N/A'}) de tang conversion ban dau.`,
      `Dat muc tieu nang san luong nhom cham them ${Math.max(5, Math.round(gapQuantity * 0.2))} phan/thang, theo doi uplift theo tung mon de quyet dinh giu hay tinh gon menu.`
    ]
  };

  return {
    intent: 'admin_product_sales_dashboard',
    dashboardView: productView,
    answer: answerByView[productView] || answerByView.top_selling_5,
    recommendations: recommendationsByView[productView] || recommendationsByView.top_selling_5,
    marketingStrategies: dynamicMarketingStrategiesByView[productView] || dynamicMarketingStrategiesByView.top_selling_5,
    quickActions: [
      { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' }
    ],
    smartPrompts: [
      'Thong ke top 5 mon duoc ban chay nhat.',
      'Mon nao ban chay nhat?',
      'Top nhung mon e nhat.'
    ],
    productSales: {
      period: '30d',
      generatedAt: new Date().toISOString(),
      totalDistinctItems: normalizedWithImage.length,
      topSelling,
      bestSeller,
      slowestSelling
    }
  };
}

function buildOrderIdRequiredAnswer() {
  return {
    intent: 'admin_order_id_required',
    answer: 'De danh gia rui ro theo model va du lieu don hang, ban can cung cap orderId hoac orderNumber cu the.',
    recommendations: [
      'Mau 1: Danh gia rui ro cho orderId 65f1c3ab12cd34ef56ab7890.',
      'Mau 2: Danh gia rui ro cho ORD-2026-1024.',
      'Sau khi co ma don, AI se tra ve xac suat huy don va tre SLA.'
    ],
    quickActions: [
      { type: 'route', label: 'Loc don rui ro cao', route: '/admin', queryParams: { risk: 'high' } }
    ],
    smartPrompts: [
      'Top 3 don can uu tien xu ly trong 2 gio toi?',
      'Cho toi bao cao doanh thu va loi nhuan 30 ngay.',
      'Cho toi 3 don nguy co huy cao nhat.'
    ]
  };
}

function normalizeQuestion(question) {
  return String(question || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function detectGeneralIntent(question) {
  const q = normalizeQuestion(question);

  if (!q) return 'empty';
  if (/(xin chao|chao|hello|hi|alo)/.test(q)) return 'greeting';
  if (/(ban la ai|muc tieu|chuc nang|lam duoc gi|co the giup)/.test(q)) return 'capabilities';
  if (/(huong dan|bat dau|su dung|cach dung|workflow|quy trinh)/.test(q)) return 'usage';
  if (/(khuyen mai|voucher|marketing|cham soc khach hang|crm)/.test(q)) return 'business_ops';
  if (/(bao mat|phan quyen|audit|log|an toan du lieu)/.test(q)) return 'security_ops';
  if (/(cam on|thanks|thank you)/.test(q)) return 'thanks';

  return 'unknown';
}

function buildGeneralAnswer(question) {
  const intent = detectGeneralIntent(question);

  if (intent === 'empty') {
    return {
      intent: 'general_empty',
      answer: 'Ban co the dat cau hoi cu the hon. Vi du: doanh thu 30 ngay, don tre hien tai, hoac danh gia rui ro don theo orderId.',
      recommendations: [
        'Hoi ve dashboard KPI: doanh thu, loi nhuan, ty le huy.',
        'Hoi ve van hanh: don tre SLA va muc uu tien xu ly.',
        'Nhap orderId de AI cham diem rui ro cho tung don.'
      ],
      quickActions: [
        { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' }
      ],
      smartPrompts: [
        'Cho toi dashboard doanh thu 30 ngay.',
        'Thong ke don tre va don huy hien tai.',
        'Voi orderId nay, hay danh gia rui ro cho toi.'
      ]
    };
  }

  if (intent === 'greeting') {
    return {
      intent: 'general_greeting',
      answer: 'Xin chao admin. Tro ly AI da san sang ho tro van hanh, bao cao KPI, doanh thu, loi nhuan uoc tinh, don tre va don huy.',
      recommendations: [
        'Ban co the hoi thong tin dashboard theo 30 ngay gan nhat.',
        'Hoac gui orderId de AI cham diem rui ro huy/tre SLA theo don.'
      ],
      quickActions: [
        { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' }
      ],
      smartPrompts: [
        'Tom tat KPI van hanh hom nay.',
        'Don nao can uu tien xu ly ngay?',
        'Ty le huy don dang tang hay giam?'
      ]
    };
  }

  if (intent === 'capabilities') {
    return {
      intent: 'general_capabilities',
      answer: 'Toi co 3 nhom nang luc chinh: (1) Bao cao KPI trong chat, (2) Cham diem rui ro don theo orderId, (3) De xuat hanh dong dieu phoi don tre/huy cho admin.',
      recommendations: [
        'Dung cau hoi dashboard de lay bao cao nhanh ngay trong chat.',
        'Dung orderId khi can danh gia 1 don cu the.',
        'Dung quick action de mo trang report hoac loc don rui ro cao.'
      ],
      quickActions: [
        { type: 'route', label: 'Loc don rui ro cao', route: '/admin', queryParams: { risk: 'high' } },
        { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' }
      ],
      smartPrompts: [
        'Cho toi bao cao doanh thu va loi nhuan 30 ngay.',
        'Don tre hien tai bao nhieu phan tram?',
        'De xuat ke hoach giam huy don trong tuan toi.'
      ]
    };
  }

  if (intent === 'usage') {
    return {
      intent: 'general_usage',
      answer: 'Cach dung nhanh: (1) Hoi dashboard/bieu do de xem KPI, (2) Dan orderId de cham diem rui ro, (3) Chon quick action de di den man hinh quan ly lien quan.',
      recommendations: [
        'Mau 1: "Cho toi bao cao dashboard 30 ngay".',
        'Mau 2: "Thong ke don tre va don huy hien tai".',
        'Mau 3: "Danh gia rui ro cho orderId ...".'
      ],
      quickActions: [
        { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' }
      ],
      smartPrompts: [
        'Top 3 don can uu tien xu ly trong 2 gio toi.',
        'Kiem tra canh bao tre SLA hom nay.',
        'Tom tat xu huong doanh thu 7 ngay gan nhat.'
      ]
    };
  }

  if (intent === 'business_ops') {
    return {
      intent: 'general_business_ops',
      answer: 'Voi cau hoi van hanh/marketing ngoai le, toi de xuat tiep can theo KPI: doanh thu, chuyen doi voucher, ty le huy, va muc tre SLA de toi uu ca doanh thu lan trai nghiem khach hang.',
      recommendations: [
        'Theo doi doanh thu theo ngay va hieu qua voucher theo nhom khach.',
        'Giam huy don bang xac nhan don gia tri cao som.',
        'Canh bao don tre de uu tien dieu phoi bep/tai xe.'
      ],
      quickActions: [
        { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' },
        { type: 'route', label: 'Loc don rui ro cao', route: '/admin', queryParams: { risk: 'high' } }
      ],
      smartPrompts: [
        'Cho toi dashboard KPI lien quan den voucher.',
        'Phan tich nguyen nhan don tre tang trong 7 ngay qua.',
        'Uu tien xu ly don nao de giam huy don?'
      ]
    };
  }

  if (intent === 'security_ops') {
    return {
      intent: 'general_security_ops',
      answer: 'Goc do an toan van hanh: nen ap dung phan quyen theo vai tro, ghi log hanh dong admin, va review dinh ky cac thay doi trang thai don de dam bao truy vet.',
      recommendations: [
        'Bat buoc login admin de truy cap chatbot quan tri.',
        'Theo doi log feedback AI va cac hanh dong cap nhat don.',
        'Dat quy trinh review khi don co rui ro cao.'
      ],
      quickActions: [
        { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' }
      ],
      smartPrompts: [
        'Tom tat cac hanh dong admin 24 gio qua.',
        'Don nao dang o muc rui ro cao can review?',
        'Cho toi bao cao tong quan KPI va canh bao.'
      ]
    };
  }

  if (intent === 'thanks') {
    return {
      intent: 'general_thanks',
      answer: 'Rat vui duoc ho tro. Neu can, toi co the tiep tuc phan tich dashboard hoac cham diem rui ro don ngay bay gio.',
      recommendations: [
        'Thu xem dashboard KPI moi nhat.',
        'Hoac gui 1 orderId de kiem tra rui ro chi tiet.'
      ],
      quickActions: [
        { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' }
      ],
      smartPrompts: [
        'Cho toi bao cao 30 ngay moi nhat.',
        'Don tre nao can uu tien?',
        'Ty le huy don hien tai la bao nhieu?'
      ]
    };
  }

  return {
    intent: 'general_unknown',
    answer: 'Toi da nhan cau hoi ngoai le. Toi co the tra loi tot nhat khi cau hoi lien quan dashboard, doanh thu, loi nhuan, don tre, don huy, hoac danh gia rui ro theo orderId.',
    recommendations: [
      'Neu cau hoi nghiep vu, hay bo sung KPI mong muon (doanh thu, huy don, tre SLA).',
      'Neu cau hoi theo don, hay gui kem orderId de toi phan tich chinh xac hon.',
      'Toi se ghi nhan cau hoi nay de cai thien bo du lieu huan luyen intent sau.'
    ],
    quickActions: [
      { type: 'route', label: 'Mo Bao cao Admin', route: '/admin/report' }
    ],
    smartPrompts: [
      'Bao cao dashboard doanh thu 30 ngay.',
      'Thong ke don tre, don huy hien tai.',
      'Danh gia rui ro theo orderId cho don nay.'
    ]
  };
}

async function getPredictionForOrder(order) {
  const userStats = await getUserWindowStats(order.userId, order.createdAt);
  const features = orderToFeatures(order, userStats);
  const cancelRisk = runtime.predictCancelRisk(features, cancelModel);
  const delayRisk = runtime.predictDelayRisk(features, delayModel);
  return { features, cancelRisk, delayRisk };
}

exports.health = async (_req, res) => {
  try {
    ensureModelsLoaded();
    return res.json({
      success: true,
      service: 'admin-ai-chat',
      models: {
        cancel: Boolean(cancelModel),
        delay: Boolean(delayModel)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.predictFromOrder = async (req, res) => {
  try {
    ensureModelsLoaded();

    const orderId = req.params.orderId || req.body.orderId;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId la bat buoc' });
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });
    }

    const { features, cancelRisk, delayRisk } = await getPredictionForOrder(order);

    const orderAnalysis = buildOrderDetailedAnalysis(order, features, cancelRisk, delayRisk);

    return res.json({
      success: true,
      orderId,
      orderNumber: order.orderNumber,
      features,
      prediction: {
        cancelRisk,
        delayRisk
      },
      orderAnalysis,
      explanation: buildAdminAnswer('', cancelRisk, delayRisk)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.highRiskOrders = async (req, res) => {
  try {
    ensureModelsLoaded();

    const minCancel = Number(req.query.minCancel ?? cancelModel.threshold ?? 0.6);
    const minDelay = Number(req.query.minDelay ?? delayModel.threshold ?? 0.45);
    const limit = Math.min(200, Number(req.query.limit || 50));

    const orders = await Order.find({ status: { $in: ['pending', 'confirmed', 'preparing', 'delivering'] } })
      .sort({ createdAt: -1 })
      .limit(400)
      .lean();

    const scored = [];
    for (const order of orders) {
      const { cancelRisk, delayRisk } = await getPredictionForOrder(order);
      if (cancelRisk.probability >= minCancel || delayRisk.probability >= minDelay) {
        scored.push({
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          cancelRisk,
          delayRisk,
          riskScore: Number((Math.max(cancelRisk.probability, delayRisk.probability)).toFixed(6))
        });
      }
    }

    scored.sort((a, b) => b.riskScore - a.riskScore);

    return res.json({
      success: true,
      thresholds: { minCancel, minDelay },
      total: scored.length,
      orders: scored.slice(0, limit)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.ask = async (req, res) => {
  try {
    ensureModelsLoaded();

    const { question, orderId, orderFeatures } = req.body || {};
    const detectedRef = !orderId ? extractOrderReference(question) : null;
    let detectedOrder = null;

    if (detectedRef) {
      detectedOrder = await resolveOrderFromReference(detectedRef);
    }

    const promptIntent = detectPromptIntent(question);

    if (promptIntent === 'dashboard' && !orderId && !detectedOrder) {
      const dashboardView = detectDashboardView(question);
      const report = await buildDashboardReport(dashboardView);
      const answer = buildDashboardAnswer(report, dashboardView);

      return res.json({
        success: true,
        ...answer,
        report,
        order: null,
        prediction: null
      });
    }

    if (promptIntent === 'product_sales' && !orderId && !detectedOrder) {
      const productSales = await buildProductSalesAnswer(detectProductSalesView(question));
      return res.json({
        success: true,
        ...productSales,
        smartPrompts: uniqPrompts(productSales.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (promptIntent === 'top_priority' && !orderId && !detectedOrder) {
      const plan = await buildTopPriorityPlan();
      return res.json({
        success: true,
        ...plan,
        smartPrompts: uniqPrompts(plan.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (promptIntent === 'cancel_process' && !orderId && !detectedOrder) {
      const process = await buildCancelReductionProcess();
      return res.json({
        success: true,
        ...process,
        smartPrompts: uniqPrompts(process.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (promptIntent === 'sla_dispatch' && !orderId && !detectedOrder) {
      const plan = await buildSlaDispatchPlan();
      return res.json({
        success: true,
        ...plan,
        smartPrompts: uniqPrompts(plan.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (promptIntent === 'monitoring' && !orderId && !detectedOrder) {
      const monitoring = await buildMonitoringSnapshot();
      return res.json({
        success: true,
        ...monitoring,
        smartPrompts: uniqPrompts(monitoring.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (promptIntent === 'action_summary' && !orderId && !detectedOrder) {
      const summary = await buildAdminActionSummary();
      return res.json({
        success: true,
        ...summary,
        smartPrompts: uniqPrompts(summary.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (promptIntent === 'high_risk_summary' && !orderId && !detectedOrder) {
      const summary = await buildHighRiskSummary(5);
      return res.json({
        success: true,
        ...summary,
        smartPrompts: uniqPrompts(summary.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (promptIntent === 'order_required' && !orderId && !detectedOrder) {
      const answer = buildOrderIdRequiredAnswer();
      return res.json({
        success: true,
        ...answer,
        smartPrompts: uniqPrompts(answer.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (isDashboardReportQuestion(question) && !orderId && !detectedOrder) {
      const dashboardView = detectDashboardView(question);
      const report = await buildDashboardReport(dashboardView);
      const answer = buildDashboardAnswer(report, dashboardView);

      return res.json({
        success: true,
        ...answer,
        report,
        order: null,
        prediction: null
      });
    }

    if (isTopPriorityPrompt(question) && !orderId && !detectedOrder) {
      const plan = await buildTopPriorityPlan();
      return res.json({
        success: true,
        ...plan,
        smartPrompts: uniqPrompts(plan.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (isCancelProcessPrompt(question) && !orderId && !detectedOrder) {
      const process = await buildCancelReductionProcess();
      return res.json({
        success: true,
        ...process,
        smartPrompts: uniqPrompts(process.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (isSlaDispatchPrompt(question) && !orderId && !detectedOrder) {
      const plan = await buildSlaDispatchPlan();
      return res.json({
        success: true,
        ...plan,
        smartPrompts: uniqPrompts(plan.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (isModelMonitoringQuestion(question) && !orderId && !detectedOrder) {
      const monitoring = await buildMonitoringSnapshot();
      return res.json({
        success: true,
        ...monitoring,
        smartPrompts: uniqPrompts(monitoring.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (isHighRiskListQuestion(question) && !orderId && !detectedOrder) {
      const summary = await buildHighRiskSummary(5);
      return res.json({
        success: true,
        ...summary,
        smartPrompts: uniqPrompts(summary.smartPrompts),
        order: null,
        prediction: null
      });
    }

    if (!orderId && !(orderFeatures && typeof orderFeatures === 'object')) {
      const general = buildGeneralAnswer(question);

      await AdminAction.create({
        adminId: req.user.id,
        action: 'ai_chat_general_question',
        targetType: 'admin_ai_chat',
        details: {
          intent: general.intent,
          question: String(question || '').slice(0, 1000),
          source: 'admin_ai_chat_widget'
        }
      });

      return res.json({
        success: true,
        ...general,
        smartPrompts: uniqPrompts(general.smartPrompts),
        order: null,
        prediction: null
      });
    }

    let features = null;
    let orderRef = null;

    if (orderId || detectedOrder) {
      const order = detectedOrder || await Order.findById(orderId).lean();
      if (!order) {
        const fallback = buildGeneralAnswer(question);
        return res.json({
          success: true,
          ...fallback,
          answer: `Khong tim thay don hang theo ma da cung cap. ${fallback.answer}`,
          smartPrompts: uniqPrompts([
            'Hay gui dung orderId (24 ky tu) de toi phan tich.',
            ...(fallback.smartPrompts || [])
          ]),
          order: null,
          prediction: null
        });
      }
      const pred = await getPredictionForOrder(order);
      features = pred.features;
      const orderAnalysis = buildOrderDetailedAnalysis(order, features, pred.cancelRisk, pred.delayRisk);
      orderRef = {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status
      };
      const answer = buildAdminAnswer(question, pred.cancelRisk, pred.delayRisk);
      return res.json({
        success: true,
        ...answer,
        smartPrompts: uniqPrompts([
          ...buildSmartPrompts(pred.cancelRisk, pred.delayRisk),
          'Cho toi dashboard KPI 30 ngay moi nhat.',
          'Top don rui ro cao can xu ly ngay.'
        ]),
        order: orderRef,
        prediction: {
          cancelRisk: pred.cancelRisk,
          delayRisk: pred.delayRisk
        },
        orderAnalysis,
        topFeatures: {
          cancelRisk: cancelModel.topFeatureImportances || [],
          delayRisk: delayModel.topFeatureImportances || []
        }
      });
    }

    if (orderFeatures && typeof orderFeatures === 'object') {
      features = orderFeatures;
    }

    const cancelRisk = runtime.predictCancelRisk(features, cancelModel);
    const delayRisk = runtime.predictDelayRisk(features, delayModel);
    const answer = buildAdminAnswer(question, cancelRisk, delayRisk);

    return res.json({
      success: true,
      ...answer,
      smartPrompts: uniqPrompts([
        ...buildSmartPrompts(cancelRisk, delayRisk),
        'Cho toi bao cao doanh thu va loi nhuan hien tai.',
        'Thong ke don tre va don huy ngay bay gio.'
      ]),
      order: orderRef,
      prediction: {
        cancelRisk,
        delayRisk
      },
      topFeatures: {
        cancelRisk: cancelModel.topFeatureImportances || [],
        delayRisk: delayModel.topFeatureImportances || []
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.feedback = async (req, res) => {
  try {
    const { messageId, question, answer, rating, orderId, reason, tags } = req.body || {};

    if (!answer || typeof answer !== 'string') {
      return res.status(400).json({ success: false, message: 'Noi dung cau tra loi la bat buoc' });
    }

    if (!['up', 'down'].includes(rating)) {
      return res.status(400).json({ success: false, message: 'rating phai la up hoac down' });
    }

    await AdminAction.create({
      adminId: req.user.id,
      action: 'ai_chat_feedback',
      targetType: 'admin_ai_chat',
      targetId: messageId || null,
      details: {
        rating,
        question: String(question || ''),
        answer: String(answer || ''),
        orderId: orderId || null,
        reason: String(reason || ''),
        tags: Array.isArray(tags) ? tags.slice(0, 6) : [],
        source: 'admin_ai_chat_widget'
      }
    });

    const recommendations = rating === 'down'
      ? [
          'Thu cung cap them orderId de AI cham diem sat hon.',
          'Dat cau hoi cu the theo KPI: huy don, tre SLA, doanh thu.',
          'Su dung hanh dong Loc don rui ro cao de ra quyet dinh nhanh.'
        ]
      : [
          'Feedback da duoc ghi nhan de tiep tuc toi uu model.'
        ];

    return res.json({
      success: true,
      message: 'Da ghi nhan feedback cho AI chatbot.',
      recommendations
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.monitoring = async (_req, res) => {
  try {
    ensureModelsLoaded();

    const since = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);
    const orders = await Order.find({ createdAt: { $gte: since } }).sort({ createdAt: 1 }).lean();

    const weekly = {};
    const featureRows = [];

    for (const o of orders) {
      const { features, cancelRisk, delayRisk } = await getPredictionForOrder(o);
      featureRows.push(features);
      const wk = weekKey(o.createdAt);

      if (!weekly[wk]) {
        weekly[wk] = {
          cancelTrue: [],
          cancelPred: [],
          delayTrue: [],
          delayPred: []
        };
      }

      weekly[wk].cancelTrue.push(o.status === 'cancelled' ? 1 : 0);
      weekly[wk].cancelPred.push(cancelRisk.label);
      weekly[wk].delayTrue.push(isDelayRiskTruth(o));
      weekly[wk].delayPred.push(delayRisk.label);
    }

    const weeklyMetrics = Object.entries(weekly)
      .map(([week, item]) => ({
        week,
        cancel: evaluateBinary(item.cancelTrue, item.cancelPred),
        delay: evaluateBinary(item.delayTrue, item.delayPred)
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    const cancelDrift = calcDriftScore(cancelModel, featureRows);
    const delayDrift = calcDriftScore(delayModel, featureRows);

    const metricThresholds = parseMetricThresholds();
    const offlineValidation = {
      cancel: buildOfflineValidationSnapshot(cancelModel),
      delay: buildOfflineValidationSnapshot(delayModel)
    };
    const metricAlerts = {
      cancel: buildMetricAlert('cancel', offlineValidation.cancel.business, metricThresholds),
      delay: buildMetricAlert('delay', offlineValidation.delay.business, metricThresholds)
    };

    return res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      modelInfo: {
        cancel: {
          threshold: cancelModel.threshold,
          validation: cancelModel.metrics || null
        },
        delay: {
          threshold: delayModel.threshold,
          validation: delayModel.metrics || null
        }
      },
      drift: {
        cancel: cancelDrift,
        delay: delayDrift
      },
      metricThresholds,
      metricAlerts,
      offlineValidation,
      weeklyMetrics
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.metrics = async (req, res) => {
  try {
    ensureModelsLoaded();

    const metricThresholds = parseMetricThresholds(req.query || {});
    const offlineValidation = {
      cancel: buildOfflineValidationSnapshot(cancelModel),
      delay: buildOfflineValidationSnapshot(delayModel)
    };

    const metricAlerts = {
      cancel: buildMetricAlert('cancel', offlineValidation.cancel.business, metricThresholds),
      delay: buildMetricAlert('delay', offlineValidation.delay.business, metricThresholds)
    };

    return res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      metricThresholds,
      metricAlerts,
      metrics: {
        cancel: {
          accuracy: offlineValidation.cancel.business?.accuracy ?? null,
          recall: offlineValidation.cancel.business?.recall ?? null,
          threshold: offlineValidation.cancel.threshold
        },
        delay: {
          accuracy: offlineValidation.delay.business?.accuracy ?? null,
          recall: offlineValidation.delay.business?.recall ?? null,
          threshold: offlineValidation.delay.threshold
        }
      },
      offlineValidation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.profileHints = async (_req, res) => {
  try {
    const [orders, users] = await Promise.all([
      Order.find({}).sort({ createdAt: -1 }).limit(10).lean(),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('_id username fullName').lean()
    ]);

    return res.json({
      success: true,
      latestOrders: orders.map((o) => ({
        orderId: o._id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt
      })),
      users: users.map((u) => ({
        id: u._id,
        username: u.username,
        fullName: u.fullName
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
