const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  adminId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:     { type: String, required: true },
  targetType: { type: String },
  targetId:   { type: String },
  details:    { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('AdminAction', adminActionSchema);
