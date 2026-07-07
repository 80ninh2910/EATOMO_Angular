/**
 * Script: Đánh dấu 6 bowls đại diện là isFeatured = true
 * Chọn 1-2 bowl từ mỗi category để Home screen có đủ đa dạng
 *
 * Usage: node seed/set_featured.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Bowl = require('../models/Bowl');

// 6 bowls đại diện — 1-2 từ mỗi category
const FEATURED_IDS = [
  'L3',  // Low-cal:      Prawns, soba, onsen egg
  'L8',  // Low-cal:      Basa fish, soba, avocado
  'B6',  // Balanced:     Salmon, brown rice, spinach
  'B10', // Balanced:     Full beef steak, brown rice
  'H5',  // High-protein: Beef + chicken, brown rice (best seller)
  'V2',  // Vegetarian:   Soba, avocado, chickpeas
];

async function setFeatured() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/eatomo_db';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  // Reset tất cả về false trước
  await Bowl.updateMany({}, { isFeatured: false });
  console.log('🔄 Reset all isFeatured → false');

  // Set các bowl được chọn là true
  const result = await Bowl.updateMany(
    { _id: { $in: FEATURED_IDS } },
    { isFeatured: true }
  );
  console.log(`⭐ Set isFeatured = true for ${result.modifiedCount} bowls:`, FEATURED_IDS.join(', '));

  // Verify
  const featured = await Bowl.find({ isFeatured: true }).select('_id name category');
  console.log('\n📋 Featured bowls now:');
  featured.forEach(b => console.log(`   ${b._id} | ${b.category}`));

  await mongoose.disconnect();
  console.log('\n✅ Done! GET /api/bowls/featured should now return 6 bowls.');
}

setFeatured().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
