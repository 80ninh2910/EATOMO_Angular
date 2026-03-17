const fs = require('fs');
const path = require('path');

const MODEL_PATHS = {
  cancel: path.join(__dirname, '..', '..', 'models', 'cancel_risk_baseline.json'),
  delay: path.join(__dirname, '..', '..', 'models', 'delay_risk_baseline.json')
};

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

function loadModel(modelKey = 'cancel') {
  const modelPath = MODEL_PATHS[modelKey];
  if (!modelPath) {
    throw new Error(`Unknown model key: ${modelKey}`);
  }
  if (!fs.existsSync(modelPath)) {
    throw new Error(`Model not found: ${modelPath}`);
  }
  const raw = fs.readFileSync(modelPath, 'utf8');
  return JSON.parse(raw);
}

function encodeInput(input, modelArtifact) {
  const numeric = modelArtifact.featureConfig.numeric;
  const pms = modelArtifact.featureConfig.paymentMethods;
  const segments = modelArtifact.featureConfig.userSegments || [];

  const values = [];
  for (const f of numeric) {
    values.push(Number(input[f] || 0));
  }
  for (const pm of pms) {
    values.push(input.payment_method === pm ? 1 : 0);
  }

  for (const seg of segments) {
    values.push(input.user_segment === seg ? 1 : 0);
  }

  const mean = modelArtifact.standardization.mean;
  const std = modelArtifact.standardization.std;

  return values.map((v, i) => (v - mean[i]) / (std[i] || 1));
}

function predictCancelRisk(input, modelArtifact) {
  const x = encodeInput(input, modelArtifact);
  const z = dot(modelArtifact.model.weights, x) + modelArtifact.model.bias;
  const probability = sigmoid(z);

  return {
    probability: Number(probability.toFixed(6)),
    threshold: modelArtifact.threshold,
    label: probability >= modelArtifact.threshold ? 1 : 0
  };
}

function predictDelayRisk(input, modelArtifact) {
  return predictCancelRisk(input, modelArtifact);
}

module.exports = {
  MODEL_PATHS,
  loadModel,
  predictCancelRisk,
  predictDelayRisk
};
