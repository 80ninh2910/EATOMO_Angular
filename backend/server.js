require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const bowlRoutes = require('./routes/bowl.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');
const promotionRoutes = require('./routes/promotion.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ───────── Middleware ─────────
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4000'],
  credentials: true
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ───────── Routes ─────────
app.get('/api', (req, res) => {
  res.json({ message: 'EATOMO API is running', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/bowls', bowlRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/vouchers', promotionRoutes);

// ───────── Error handler ─────────
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// ───────── Start server ─────────
async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ Cannot start server without database connection.');
    console.error('   Make sure MongoDB is running on', process.env.MONGO_URI);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 EATOMO Backend running on http://localhost:${PORT}`);
    console.log(`   API base: http://localhost:${PORT}/api`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

start();
