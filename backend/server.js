require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/database');

// ── App must be created BEFORE using it ──
const app = express();
const PREFERRED_PORT = Number(process.env.PORT) || 3000;

// ───────── View Engine (EJS) ─────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const authRoutes       = require('./routes/auth.routes');
const bowlRoutes       = require('./routes/bowl.routes');
const orderRoutes      = require('./routes/order.routes');
const adminRoutes      = require('./routes/admin.routes');
const promotionRoutes  = require('./routes/promotion.routes');
const chatRoutes       = require('./routes/chat.routes');
const adminAiChatRoutes = require('./routes/admin-ai-chat.routes');

// ───────── CORS ─────────
const ALLOWED_ORIGINS = [
  // Local dev
  'http://localhost:4200',
  'http://localhost:4000',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:4000',
  // Production — Add your real Render/Vercel/Netlify URLs here
  process.env.FRONTEND_URL,                 // set in Render env vars
  'https://eatomo-angular.onrender.com',    // adjust if different
  'https://eatomo-angular.vercel.app',
].filter(Boolean); // remove undefined entries

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser tools (curl, Postman, etc.) — no Origin header
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // Allow any localhost port for development convenience
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());

// ───────── Request logger ─────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ───────── Routes ─────────
app.get('/api', (req, res) => {
  res.json({ message: 'EATOMO API is running', version: '1.0.0' });
});

app.use('/api/auth',       authRoutes);
app.use('/api/bowls',      bowlRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/vouchers',   promotionRoutes);
app.use('/api/chat',       chatRoutes);
app.use('/api/admin/ai-chat', adminAiChatRoutes);

// ───────── Error handler ─────────
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ───────── 404 handler ─────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// ───────── Start server ─────────
async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ Cannot start server without database connection.');
    console.error('   MONGO_URI:', process.env.MONGO_URI);
    process.exit(1);
  }

  const maxRetries = 10;

  const listenWithFallback = (port, retriesLeft) => {
    const server = app.listen(port, () => {
      console.log(`\n🚀 EATOMO Backend running on port ${port}`);
      console.log(`   API base: /api`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
      if (port !== PREFERRED_PORT) {
        console.log(`ℹ️ Preferred port ${PREFERRED_PORT} was busy, switched to ${port}.\n`);
      }
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE' && retriesLeft > 0) {
        console.warn(`⚠️ Port ${port} is in use, retrying on ${port + 1}...`);
        listenWithFallback(port + 1, retriesLeft - 1);
        return;
      }
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    });
  };

  listenWithFallback(PREFERRED_PORT, maxRetries);
}

start();
