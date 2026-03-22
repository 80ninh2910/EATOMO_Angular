const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eatomo_db';
let connectionPromise = null;

function hasInvalidVercelMongoUri() {
  if (!process.env.VERCEL) return false;
  if (!process.env.MONGO_URI) return true;
  return /localhost|127\.0\.0\.1/i.test(process.env.MONGO_URI);
}

async function connectDB() {
  if (hasInvalidVercelMongoUri()) {
    console.error('MongoDB connection skipped: MONGO_URI is missing or points to localhost in Vercel.');
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (connectionPromise) {
    await connectionPromise;
    return mongoose.connection.readyState === 1;
  }

  try {
    connectionPromise = mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 5
    });
    await connectionPromise;
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    connectionPromise = null;
    return false;
  }
}

module.exports = { connectDB };
