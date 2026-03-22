const { createApp } = require('../backend/app');
const { connectDB } = require('../backend/config/database');

const app = createApp();
let dbReadyPromise = null;

async function ensureDbReady() {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB().then((connected) => {
      if (!connected) {
        throw new Error('Database connection failed');
      }
      return true;
    });
  }

  return dbReadyPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureDbReady();
    return app(req, res);
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
    return;
  }
};
