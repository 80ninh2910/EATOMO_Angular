require('dotenv').config();
const { createApp } = require('./app');
const { connectDB } = require('./config/database');

const app = createApp();
const PREFERRED_PORT = Number(process.env.PORT) || 3000;

// ───────── Start server ─────────
async function start() {
  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('MongoDB not connected');
    }
  } catch (err) {
    console.error('Cannot start server without database connection.');
    console.error('   Make sure MongoDB is running on', process.env.MONGO_URI);
    process.exit(1);
  }

  const maxRetries = 10;

  const listenWithFallback = (port, retriesLeft) => {
    const server = app.listen(port, () => {
      console.log(`\nEATOMO Backend running on http://localhost:${port}`);
      console.log(`   API base: http://localhost:${port}/api`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);

      if (port !== PREFERRED_PORT) {
        console.log(`Preferred port ${PREFERRED_PORT} was busy, switched to ${port}.\n`);
      }
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE' && retriesLeft > 0) {
        console.warn(`Port ${port} is in use, retrying on ${port + 1}...`);
        listenWithFallback(port + 1, retriesLeft - 1);
        return;
      }

      console.error('Failed to start server:', error.message);
      process.exit(1);
    });
  };

  listenWithFallback(PREFERRED_PORT, maxRetries);
}

start();
