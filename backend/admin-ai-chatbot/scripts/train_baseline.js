const fs = require('fs');
const path = require('path');

const DATASET_PATH = path.join(__dirname, '..', 'data', 'processed', 'orders_training_dataset.jsonl');
const TARGET_MAP = {
  cancel: {
    label: 'label_cancelled',
    modelPath: path.join(__dirname, '..', 'models', 'cancel_risk_baseline.json')
  },
  delay: {
    label: 'label_delay_risk',
    modelPath: path.join(__dirname, '..', 'models', 'delay_risk_baseline.json')
  }
};

const NUMERIC_FEATURES = [
  'user_orders_90d',
  'user_spent_90d',
  'user_avg_order_value_90d',
  'user_days_since_last_order',
  'item_count',
  'total_quantity',
  'subtotal',
  'tax',
  'shipping_fee',
  'discount_amount',
  'total_amount',
  'avg_item_price',
  'has_voucher',
  'weekday',
  'hour_of_day',
  'month',
  'qty_low_cal',
  'qty_balanced',
  'qty_high_protein',
  'qty_vegetarian',
  'age_hours'
];

const PAYMENT_METHODS = ['cash', 'momo', 'card', 'bank_transfer'];
const USER_SEGMENTS = ['new', 'regular', 'vip', 'at_risk'];

function parseTargetArg() {
  const arg = process.argv.find((a) => a.startsWith('--target='));
  if (!arg) return 'cancel';
  const key = String(arg.split('=')[1] || '').trim();
  if (!TARGET_MAP[key]) {
    throw new Error(`Unsupported target '${key}'. Use one of: ${Object.keys(TARGET_MAP).join(', ')}`);
  }
  return key;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function sigmoid(x) {
  if (x > 30) return 1;
  if (x < -30) return 0;
  return 1 / (1 + Math.exp(-x));
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i];
  return s;
}

function parseJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));
}

function encodeRow(row) {
  const values = [];

  for (const f of NUMERIC_FEATURES) {
    values.push(Number(row[f] || 0));
  }

  for (const pm of PAYMENT_METHODS) {
    values.push(row.payment_method === pm ? 1 : 0);
  }

  for (const seg of USER_SEGMENTS) {
    values.push(row.user_segment === seg ? 1 : 0);
  }

  // Feature engineering for better separability.
  const subtotal = Number(row.subtotal || 0);
  const total = Number(row.total_amount || 0);
  const totalQty = Number(row.total_quantity || 0);
  const userAvg = Number(row.user_avg_order_value_90d || 0);
  const discount = Number(row.discount_amount || 0);
  const shipping = Number(row.shipping_fee || 0);
  const ageHours = Number(row.age_hours || 0);

  values.push(subtotal > 0 ? discount / subtotal : 0); // discount_ratio
  values.push(total > 0 ? shipping / total : 0); // shipping_ratio
  values.push(totalQty > 0 ? Number(row.qty_high_protein || 0) / totalQty : 0); // high_protein_share
  values.push(totalQty > 0 ? Number(row.qty_vegetarian || 0) / totalQty : 0); // vegetarian_share
  values.push(userAvg > 0 ? total / userAvg : 1); // value_vs_user_avg
  values.push((row.payment_method === 'cash' ? 1 : 0) * ageHours); // cash_age_interaction

  return values;
}

function standardize(trainX, valX) {
  const cols = trainX[0].length;
  const mean = new Array(cols).fill(0);
  const std = new Array(cols).fill(0);

  for (let c = 0; c < cols; c += 1) {
    for (let i = 0; i < trainX.length; i += 1) mean[c] += trainX[i][c];
    mean[c] /= trainX.length;

    let varSum = 0;
    for (let i = 0; i < trainX.length; i += 1) {
      const d = trainX[i][c] - mean[c];
      varSum += d * d;
    }
    std[c] = Math.sqrt(varSum / trainX.length) || 1;
  }

  const normalize = (rows) => rows.map((r) => r.map((v, c) => (v - mean[c]) / std[c]));
  return {
    trainX: normalize(trainX),
    valX: normalize(valX),
    mean,
    std
  };
}

function splitByTime(rows, trainRatio = 0.8) {
  const sorted = [...rows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const cut = Math.max(1, Math.floor(sorted.length * trainRatio));
  return {
    train: sorted.slice(0, cut),
    val: sorted.slice(cut)
  };
}

function trainLogisticRegression(trainX, trainY, opts = {}) {
  const epochs = opts.epochs || 800;
  const learningRate = opts.learningRate || 0.05;
  const l2 = opts.l2 || 0.0005;

  const n = trainX.length;
  const m = trainX[0].length;

  let w = new Array(m).fill(0);
  let b = 0;

  const positive = trainY.reduce((s, y) => s + y, 0);
  const negative = trainY.length - positive;
  const posWeight = positive > 0 ? negative / positive : 1;

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const gradW = new Array(m).fill(0);
    let gradB = 0;

    for (let i = 0; i < n; i += 1) {
      const z = dot(w, trainX[i]) + b;
      const p = sigmoid(z);
      const y = trainY[i];
      const sampleWeight = y === 1 ? posWeight : 1;
      const err = (p - y) * sampleWeight;

      for (let j = 0; j < m; j += 1) gradW[j] += err * trainX[i][j];
      gradB += err;
    }

    for (let j = 0; j < m; j += 1) {
      const reg = l2 * w[j];
      w[j] -= learningRate * ((gradW[j] / n) + reg);
    }
    b -= learningRate * (gradB / n);
  }

  return { weights: w, bias: b };
}

function predictProb(model, x) {
  return sigmoid(dot(model.weights, x) + model.bias);
}

function evaluate(model, X, Y, threshold) {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (let i = 0; i < X.length; i += 1) {
    const p = predictProb(model, X[i]);
    const pred = p >= threshold ? 1 : 0;
    const y = Y[i];

    if (pred === 1 && y === 1) tp += 1;
    else if (pred === 1 && y === 0) fp += 1;
    else if (pred === 0 && y === 0) tn += 1;
    else fn += 1;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const accuracy = (tp + tn) / Math.max(1, tp + tn + fp + fn);

  return {
    threshold,
    accuracy: Number(accuracy.toFixed(4)),
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1: Number(f1.toFixed(4)),
    confusion: { tp, fp, tn, fn }
  };
}

function findBestThreshold(model, X, Y) {
  let best = null;
  for (let t = 0.1; t <= 0.9; t += 0.02) {
    const metrics = evaluate(model, X, Y, Number(t.toFixed(2)));
    if (!best || metrics.f1 > best.f1) {
      best = metrics;
    }
  }
  return best;
}

function findBusinessThreshold(model, X, Y, targetKey) {
  let best = null;
  let bestConstrained = null;
  for (let t = 0.1; t <= 0.9; t += 0.01) {
    const metrics = evaluate(model, X, Y, Number(t.toFixed(2)));

    let utility = 0;
    if (targetKey === 'cancel') {
      utility = (6 * metrics.confusion.tp) - (1.5 * metrics.confusion.fp) - (8 * metrics.confusion.fn);
    } else {
      utility = (5 * metrics.confusion.tp) - (1.2 * metrics.confusion.fp) - (6 * metrics.confusion.fn);
    }

    const candidate = { ...metrics, utility: Number(utility.toFixed(2)) };
    if (!best || candidate.utility > best.utility) {
      best = candidate;
    }

    const passConstraint = targetKey === 'cancel'
      ? candidate.recall >= 0.2 && candidate.precision >= 0.05
      : candidate.recall >= 0.55;

    if (passConstraint && (!bestConstrained || candidate.utility > bestConstrained.utility)) {
      bestConstrained = candidate;
    }
  }
  return bestConstrained || best;
}

function featureNames() {
  return [
    ...NUMERIC_FEATURES,
    ...PAYMENT_METHODS.map((pm) => `pm_${pm}`),
    ...USER_SEGMENTS.map((seg) => `seg_${seg}`),
    'discount_ratio',
    'shipping_ratio',
    'high_protein_share',
    'vegetarian_share',
    'value_vs_user_avg',
    'cash_age_interaction'
  ];
}

function main() {
  const targetKey = parseTargetArg();
  const targetConfig = TARGET_MAP[targetKey];
  const rows = parseJsonl(DATASET_PATH);
  if (rows.length < 200) {
    throw new Error('Dataset too small. Generate at least 200 rows first.');
  }

  const { train, val } = splitByTime(rows, 0.8);
  if (val.length === 0) {
    throw new Error('Validation split is empty. Increase dataset size.');
  }

  const trainXRaw = train.map(encodeRow);
  const valXRaw = val.map(encodeRow);
  const trainY = train.map((r) => Number(r[targetConfig.label] || 0));
  const valY = val.map((r) => Number(r[targetConfig.label] || 0));

  const scaled = standardize(trainXRaw, valXRaw);
  const model = trainLogisticRegression(scaled.trainX, trainY, {
    epochs: 900,
    learningRate: 0.055,
    l2: 0.0008
  });

  const bestF1 = findBestThreshold(model, scaled.valX, valY);
  let bestBusiness = findBusinessThreshold(model, scaled.valX, valY, targetKey);
  if (targetKey === 'cancel' && bestBusiness.recall < 0.15) {
    bestBusiness = { ...bestF1, utility: null };
  }

  const names = featureNames();
  const importances = names
    .map((name, idx) => ({ name, score: Math.abs(model.weights[idx]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((x) => ({ ...x, score: Number(x.score.toFixed(6)) }));

  const artifact = {
    modelType: 'logistic_regression_binary',
    target: targetConfig.label,
    targetKey,
    trainedAt: new Date().toISOString(),
    samples: {
      total: rows.length,
      train: train.length,
      validation: val.length,
      positiveTrain: trainY.reduce((s, y) => s + y, 0),
      positiveValidation: valY.reduce((s, y) => s + y, 0)
    },
    featureConfig: {
      numeric: NUMERIC_FEATURES,
      paymentMethods: PAYMENT_METHODS,
      userSegments: USER_SEGMENTS,
      allFeatures: names
    },
    standardization: {
      mean: scaled.mean,
      std: scaled.std
    },
    model,
    threshold: bestBusiness.threshold,
    metrics: {
      business: bestBusiness,
      f1Optimal: bestF1
    },
    topFeatureImportances: importances
  };

  ensureDir(targetConfig.modelPath);
  fs.writeFileSync(targetConfig.modelPath, JSON.stringify(artifact, null, 2), 'utf8');

  console.log(`[train] done (target=${targetKey})`);
  console.log(`[train] samples total=${rows.length} train=${train.length} val=${val.length}`);
  console.log(`[train] threshold_business=${bestBusiness.threshold} utility=${bestBusiness.utility} accuracy=${bestBusiness.accuracy} precision=${bestBusiness.precision} recall=${bestBusiness.recall}`);
  console.log(`[train] threshold_f1=${bestF1.threshold} f1=${bestF1.f1} accuracy=${bestF1.accuracy} recall=${bestF1.recall}`);
  console.log(`[train] model saved: ${targetConfig.modelPath}`);
}

try {
  main();
} catch (err) {
  console.error('[train] failed:', err.message);
  process.exit(1);
}
