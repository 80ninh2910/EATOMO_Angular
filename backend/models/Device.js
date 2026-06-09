const mongoose = require('mongoose');

/**
 * Device model — lưu FCM token của từng user/device
 * Một user có thể có nhiều devices (phone, tablet)
 */
const deviceSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fcmToken:  { type: String, required: true, unique: true },
  platform:  { type: String, enum: ['android', 'ios', 'web'], default: 'android' },
  deviceId:  { type: String, default: '' },   // optional fingerprint/device ID
  isActive:  { type: Boolean, default: true }
}, { timestamps: true });

// Index để query nhanh theo userId
deviceSchema.index({ userId: 1 });
deviceSchema.index({ fcmToken: 1 }, { unique: true });

module.exports = mongoose.model('Device', deviceSchema);
