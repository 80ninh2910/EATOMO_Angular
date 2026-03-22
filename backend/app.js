require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const bowlRoutes = require('./routes/bowl.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');
const promotionRoutes = require('./routes/promotion.routes');
const chatRoutes = require('./routes/chat.routes');
const adminAiChatRoutes = require('./routes/admin-ai-chat.routes');

function parseCorsOrigins() {
  const raw = String(process.env.CORS_ORIGINS || '').trim();
  const configured = raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  return new Set([
    'http://localhost:4200',
    'http://localhost:4000',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:4000',
    ...configured
  ]);
}

function isLocalDevOrigin(origin) {
  if (!origin) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(origin));
}

function isVercelPreviewOrigin(origin) {
  if (!origin) return false;
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(String(origin));
}

function createApp() {
  const app = express();
  const allowedOrigins = parseCorsOrigins();

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isLocalDevOrigin(origin) || isVercelPreviewOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  }));

  app.use(express.json());

  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.get('/api', (_req, res) => {
    res.json({ message: 'EATOMO API is running', version: '1.0.0' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/bowls', bowlRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/promotions', promotionRoutes);
  app.use('/api/vouchers', promotionRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/admin/ai-chat', adminAiChatRoutes);

  app.use((err, _req, res, _next) => {
    console.error('Server error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
  });

  return app;
}

module.exports = { createApp };