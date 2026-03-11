const mongoose = require('mongoose');

const bowlSchema = new mongoose.Schema({
  _id:         { type: String, required: true }, // 'L1', 'B2', etc.
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true },
  calories:    { type: Number, default: 0 },
  protein:     { type: Number, default: 0 },
  carbs:       { type: Number, default: 0 },
  fat:         { type: Number, default: 0 },
  category:    { type: String, enum: ['low-cal', 'balanced', 'high-protein', 'vegetarian'], required: true },
  image:       { type: String, default: '' },
  inStock:     { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false }
}, { timestamps: true });

// Virtual: id = _id
bowlSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Bowl', bowlSchema);
