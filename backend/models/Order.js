const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  bowlId:          { type: String, required: true },
  bowlName:        { type: String, required: true },
  unitPrice:       { type: Number, required: true },
  quantity:        { type: Number, required: true },
  subtotal:        { type: Number, required: true },
  customProteins:  [String],
  customVeggies:   [String],
  customSauces:    [String]
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber:     { type: String, unique: true, required: true },
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:          { type: String, enum: ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'], default: 'pending' },
  items:           [orderItemSchema],
  subtotal:        { type: Number, default: 0 },
  tax:             { type: Number, default: 0 },
  shippingFee:     { type: Number, default: 0 },
  discountAmount:  { type: Number, default: 0 },
  totalAmount:     { type: Number, default: 0 },
  paymentMethod:   { type: String, enum: ['cash', 'momo', 'card', 'bank_transfer'], default: 'cash' },
  paymentStatus:   { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
  deliveryAddress: { type: String, required: true },
  deliveryPhone:   { type: String, required: true },
  deliveryNotes:   { type: String, default: '' },
  voucherCode:     { type: String, default: '' }
}, { timestamps: true });

orderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Order', orderSchema);
