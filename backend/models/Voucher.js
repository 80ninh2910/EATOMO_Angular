const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code:             { type: String, unique: true, required: true, uppercase: true },
  description:      { type: String, default: '' },
  discountType:     { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue:    { type: Number, required: true },
  minOrderValue:    { type: Number, default: 0 },
  maxDiscountAmount:{ type: Number, default: null },
  validFrom:        { type: Date, default: Date.now },
  validUntil:       { type: Date, default: null },
  maxUses:          { type: Number, default: 9999 },
  currentUses:      { type: Number, default: 0 },
  target:           { type: String, enum: ['all', 'new_customer', 'vip', 'specific_category'], default: 'all' },
  targetCategory:   { type: String, default: null },
  isActive:         { type: Boolean, default: true }
}, { timestamps: true });

voucherSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Voucher', voucherSchema);
