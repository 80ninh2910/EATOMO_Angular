const express = require('express');
const { loadModel, predictCancelRisk, predictDelayRisk } = require('../training/runtime');

const app = express();
app.use(express.json());

const models = {
  cancel: null,
  delay: null
};

function ensureModelLoaded(modelKey) {
  if (!models[modelKey]) {
    models[modelKey] = loadModel(modelKey);
  }
}

app.get('/health', (_req, res) => {
  let loaded = true;
  let message = 'ok';
  try {
    ensureModelLoaded('cancel');
    ensureModelLoaded('delay');
  } catch (err) {
    loaded = false;
    message = err.message;
  }

  res.json({
    success: true,
    service: 'admin-ai-chatbot-model-api',
    modelLoaded: loaded,
    modelKeys: Object.keys(models).filter((k) => Boolean(models[k])),
    message
  });
});

app.post('/predict/cancel-risk', (req, res) => {
  try {
    ensureModelLoaded('cancel');

    const input = req.body || {};
    if (!input.payment_method) {
      return res.status(400).json({ success: false, message: 'payment_method is required in input payload' });
    }

    const prediction = predictCancelRisk(input, models.cancel);

    return res.json({
      success: true,
      target: 'label_cancelled',
      prediction
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/predict/delay-risk', (req, res) => {
  try {
    ensureModelLoaded('delay');

    const input = req.body || {};
    if (!input.payment_method) {
      return res.status(400).json({ success: false, message: 'payment_method is required in input payload' });
    }

    const prediction = predictDelayRisk(input, models.delay);

    return res.json({
      success: true,
      target: 'label_delay_risk',
      prediction
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/chat/admin', (req, res) => {
  try {
    ensureModelLoaded('cancel');
    ensureModelLoaded('delay');
    const { question, orderFeatures } = req.body || {};

    if (!orderFeatures) {
      return res.status(400).json({ success: false, message: 'orderFeatures is required' });
    }

    const cancelPred = predictCancelRisk(orderFeatures, models.cancel);
    const delayPred = predictDelayRisk(orderFeatures, models.delay);

    const riskText = cancelPred.probability >= 0.7
      ? 'Rui ro cao'
      : cancelPred.probability >= 0.4
        ? 'Rui ro trung binh'
        : 'Rui ro thap';

    const delayText = delayPred.probability >= 0.7
      ? 'Nguy co tre cao'
      : delayPred.probability >= 0.4
        ? 'Nguy co tre trung binh'
        : 'Nguy co tre thap';

    return res.json({
      success: true,
      intent: 'admin_order_risk_assessment',
      answer:
        `Danh gia nhanh: ${riskText}. Xac suat huy don uoc tinh ${(cancelPred.probability * 100).toFixed(1)}%. ` +
        `${delayText} voi xac suat ${(delayPred.probability * 100).toFixed(1)}%. ` +
        `Khuyen nghi: neu 1 trong 2 risk vuot nguong, uu tien lien he xac nhan va day nhanh xu ly.` ,
      question: question || '',
      prediction: {
        cancelRisk: cancelPred,
        delayRisk: delayPred
      },
      topFeatures: {
        cancelRisk: models.cancel.topFeatureImportances || [],
        delayRisk: models.delay.topFeatureImportances || []
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

const port = Number(process.env.ADMIN_AI_PORT || 3101);
app.listen(port, () => {
  console.log(`[admin-ai-chatbot] API running on port ${port}`);
});
