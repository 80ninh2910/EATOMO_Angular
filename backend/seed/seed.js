/**
 * EATOMO Database Seed Script (MongoDB / Mongoose)
 * Seeds admin user, test user, 40 bowls & sample vouchers
 *
 * Usage: node seed/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Bowl = require('../models/Bowl');
const Voucher = require('../models/Voucher');

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/eatomo_db';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB:', uri);

  // 1. Seed admin user
  const existingAdmin = await User.findOne({ username: 'admin' });
  if (!existingAdmin) {
    await User.create({
      username: 'admin',
      email: 'admin@eatomo.vn',
      password: 'admin123',           // hashed by pre-save hook
      fullName: 'Admin EATOMO',
      role: 'admin'
    });
    console.log('✅ Admin user created (admin / admin123)');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // 2. Seed test user
  const existingUser = await User.findOne({ username: 'user' });
  if (!existingUser) {
    await User.create({
      username: 'user',
      email: 'user@eatomo.vn',
      password: 'user123',            // hashed by pre-save hook
      fullName: 'Nguyen Van A',
      phone: '0901234567',
      address: '669 QL1A, Thu Duc, HCM',
      role: 'user'
    });
    console.log('✅ Test user created (user / user123)');
  } else {
    console.log('ℹ️  Test user already exists');
  }

  // 3. Seed 40 bowls
  const bowlCount = await Bowl.countDocuments();
  if (bowlCount === 0) {
    const bowls = [
      // Low Calories (10)
      { _id: 'L1', name: 'L1', description: 'Half beef steak, sweet potato, cauliflower, pickles', price: 149900, calories: 274, protein: 25, carbs: 27, fat: 7, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b1.jpg' },
      { _id: 'L2', name: 'L2', description: 'Salmon, sweet potato, mixed veggies, pak choi', price: 154900, calories: 331, protein: 24, carbs: 26, fat: 15, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b2.jpg' },
      { _id: 'L3', name: 'L3', description: 'Prawns, Japanese cold soba, onsen egg, pickles', price: 169900, calories: 341, protein: 32, carbs: 35, fat: 8, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b3.jpg' },
      { _id: 'L4', name: 'L4', description: 'Half chicken breast, baby potato, mixed veggies, pak choi', price: 139900, calories: 285, protein: 33, carbs: 23, fat: 7, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b4.jpg' },
      { _id: 'L5', name: 'L5', description: 'Half cajun chicken, Japanese cold soba, pickles, cauliflower', price: 159900, calories: 351, protein: 39, carbs: 40, fat: 4, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b5.jpg' },
      { _id: 'L6', name: 'L6', description: 'Tuna, baby potato, sweet corn, mixed veggies', price: 144900, calories: 311, protein: 34, carbs: 32, fat: 5, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b6.jpg' },
      { _id: 'L7', name: 'L7', description: 'Half cajun chicken breast, brown rice, beetroot, tomato', price: 164900, calories: 373, protein: 35, carbs: 45, fat: 6, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b1.jpg' },
      { _id: 'L8', name: 'L8', description: 'Basa fish, Japanese cold soba, avocado', price: 179900, calories: 439, protein: 33, carbs: 40, fat: 16, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b2.jpg' },
      { _id: 'L9', name: 'L9', description: 'Half beef steak, sweet potato, pak choi, broccoli, mix veggies', price: 159900, calories: 341, protein: 27, carbs: 33, fat: 11, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b3.jpg' },
      { _id: 'L10', name: 'L10', description: 'Duck breast, pumpkin, broccoli, spinach', price: 169900, calories: 351, protein: 35, carbs: 16, fat: 16, category: 'low-cal', image: '/assets/healthy/images/index/bowl-b4.jpg' },
      // Balanced (15)
      { _id: 'B1', name: 'B1', description: 'Tuna, donburi brown rice, beetroot, broccoli', price: 189900, calories: 434, protein: 43, carbs: 48, fat: 8, category: 'balanced', image: '/assets/healthy/images/index/bowl-b5.jpg' },
      { _id: 'B2', name: 'B2', description: 'Half beef steak, pasta, mushroom, pak choi, pickles, onsen egg', price: 174900, calories: 438, protein: 35, carbs: 38, fat: 16, category: 'balanced', image: '/assets/healthy/images/index/bowl-b6.jpg' },
      { _id: 'B3', name: 'B3', description: 'Prawns, Japanese cold soba, French bean, tofu', price: 164900, calories: 435, protein: 41, carbs: 54, fat: 6, category: 'balanced', image: '/assets/healthy/images/index/bowl-b1.jpg' },
      { _id: 'B4', name: 'B4', description: 'Salmon, pasta, spinach, salad and mix nuts', price: 199900, calories: 508, protein: 31, carbs: 42, fat: 24, category: 'balanced', image: '/assets/healthy/images/index/bowl-b2.jpg' },
      { _id: 'B5', name: 'B5', description: 'Duck breast, donburi brown rice, pickles', price: 189900, calories: 485, protein: 40, carbs: 36, fat: 20, category: 'balanced', image: '/assets/healthy/images/index/bowl-b3.jpg' },
      { _id: 'B6', name: 'B6', description: 'Salmon, donburi brown rice, spinach', price: 189900, calories: 455, protein: 32, carbs: 38, fat: 20, category: 'balanced', image: '/assets/healthy/images/index/bowl-b4.jpg' },
      { _id: 'B7', name: 'B7', description: 'Duck breast, donburi white rice, mix veggies, spinach', price: 199900, calories: 586, protein: 42, carbs: 49, fat: 25, category: 'balanced', image: '/assets/healthy/images/index/bowl-b5.jpg' },
      { _id: 'B8', name: 'B8', description: 'Basa fish, donburi brown rice, spinach, cabbage', price: 179900, calories: 442, protein: 37, carbs: 43, fat: 14, category: 'balanced', image: '/assets/healthy/images/index/bowl-b6.jpg' },
      { _id: 'B9', name: 'B9', description: 'Half original chicken, prawns, donburi brown rice, French bean', price: 199900, calories: 488, protein: 58, carbs: 39, fat: 11, category: 'balanced', image: '/assets/healthy/images/index/bowl-b1.jpg' },
      { _id: 'B10', name: 'B10', description: 'Full beef steak, donburi brown rice, cauliflower', price: 219900, calories: 557, protein: 54, carbs: 41, fat: 20, category: 'balanced', image: '/assets/healthy/images/index/bowl-b2.jpg' },
      { _id: 'B11', name: 'B11', description: 'Tuna, donburi white rice, broccoli, pickles', price: 189900, calories: 437, protein: 42, carbs: 52, fat: 7, category: 'balanced', image: '/assets/healthy/images/index/bowl-b3.jpg' },
      { _id: 'B12', name: 'B12', description: 'Full cajun chicken, brown rice, sweet corn, tomato', price: 209900, calories: 542, protein: 65, carbs: 52, fat: 8, category: 'balanced', image: '/assets/healthy/images/index/bowl-b4.jpg' },
      { _id: 'B13', name: 'B13', description: 'Full cajun chicken, baby potato, spinach, broccoli', price: 209900, calories: 440, protein: 64, carbs: 27, fat: 9, category: 'balanced', image: '/assets/healthy/images/index/bowl-b5.jpg' },
      { _id: 'B14', name: 'B14', description: 'Basa fish, donburi brown rice, cabbage, tomato', price: 179900, calories: 441, protein: 36, carbs: 46, fat: 12, category: 'balanced', image: '/assets/healthy/images/index/bowl-b6.jpg' },
      { _id: 'B15', name: 'B15', description: 'Half beef steak, prawns, soba, cauliflower, pickles, onsen egg', price: 199900, calories: 515, protein: 55, carbs: 41, fat: 15, category: 'balanced', image: '/assets/healthy/images/index/bowl-b1.jpg' },
      // High Protein (10)
      { _id: 'H1', name: 'H1', description: 'Half original chicken, half beef steak, donburi brown rice, spinach', price: 229900, calories: 562, protein: 62, carbs: 38, fat: 18, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b2.jpg' },
      { _id: 'H2', name: 'H2', description: 'Half beef steak, prawns, donburi white rice, baby potato, broccoli', price: 239900, calories: 615, protein: 53, carbs: 69, fat: 14, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b3.jpg' },
      { _id: 'H3', name: 'H3', description: 'Basa fish, Japanese cold soba, avocado, mixed veggies, onsen egg', price: 219900, calories: 560, protein: 39, carbs: 44, fat: 25, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b4.jpg' },
      { _id: 'H4', name: 'H4', description: 'Duck breast, prawns, sweet potato, edamame, onsen egg', price: 249900, calories: 584, protein: 66, carbs: 33, fat: 21, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b5.jpg' },
      { _id: 'H5', name: 'H5', description: 'Half beef steak, full chicken breast, donburi brown rice, pumpkin, french bean', price: 269900, calories: 720, protein: 91, carbs: 46, fat: 19, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b6.jpg' },
      { _id: 'H6', name: 'H6', description: 'Full original chicken, fusilli pasta, avocado, beetroot', price: 249900, calories: 611, protein: 65, carbs: 45, fat: 19, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b1.jpg' },
      { _id: 'H7', name: 'H7', description: 'Half beef steak, half cajun chicken breast, donburi brown, sweet corn', price: 239900, calories: 583, protein: 62, carbs: 47, fat: 16, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b2.jpg' },
      { _id: 'H8', name: 'H8', description: 'Full beef steak, donburi brown rice, baby potato, broccoli', price: 259900, calories: 649, protein: 56, carbs: 60, fat: 21, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b3.jpg' },
      { _id: 'H9', name: 'H9', description: 'Full beef steak, donburi white rice, sweet corn', price: 249900, calories: 611, protein: 54, carbs: 56, fat: 19, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b4.jpg' },
      { _id: 'H10', name: 'H10', description: 'Half cajun chicken breast, salmon, donburi white rice, tomato', price: 259900, calories: 617, protein: 60, carbs: 50, fat: 20, category: 'high-protein', image: '/assets/healthy/images/index/bowl-b5.jpg' },
      // Vegetarian (5)
      { _id: 'V1', name: 'V1', description: 'Brown rice, cauliflower, mixed veggies, edamame, mushroom', price: 129900, calories: 377, protein: 18, carbs: 55, fat: 10, category: 'vegetarian', image: '/assets/healthy/images/index/bowl-b6.jpg' },
      { _id: 'V2', name: 'V2', description: 'Japanese cold soba, cabbage, chickpeas, beetroot, avocado', price: 149900, calories: 536, protein: 19, carbs: 74, fat: 18, category: 'vegetarian', image: '/assets/healthy/images/index/bowl-b1.jpg' },
      { _id: 'V3', name: 'V3', description: 'White rice, sweet potato, avocado, sweet corn, spinach', price: 139900, calories: 520, protein: 11, carbs: 84, fat: 16, category: 'vegetarian', image: '/assets/healthy/images/index/bowl-b2.jpg' },
      { _id: 'V4', name: 'V4', description: 'Brown rice, chickpeas, tomato, avocado, french bean', price: 139900, calories: 520, protein: 16, carbs: 75, fat: 18, category: 'vegetarian', image: '/assets/healthy/images/index/bowl-b3.jpg' },
      { _id: 'V5', name: 'V5', description: 'Tofu, pasta, broccoli, edamame, purple cabbage, beetroot', price: 149900, calories: 530, protein: 33, carbs: 85, fat: 7, category: 'vegetarian', image: '/assets/healthy/images/index/bowl-b4.jpg' },
    ];

    await Bowl.insertMany(bowls);
    console.log(`✅ Seeded ${bowls.length} bowls`);
  } else {
    console.log(`ℹ️  Bowls already exist (${bowlCount} docs)`);
  }

  // 4. Seed sample vouchers
  const voucherCount = await Voucher.countDocuments();
  if (voucherCount === 0) {
    await Voucher.insertMany([
      {
        code: 'WELCOME10',
        description: 'Welcome discount 10%',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 100000,
        maxDiscountAmount: 50000,
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2026-12-31'),
        maxUses: 1000,
        target: 'new_customer',
        isActive: true
      },
      {
        code: 'EATOMO50K',
        description: 'Flat 50K off on orders over 300K',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderValue: 300000,
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2026-12-31'),
        maxUses: 500,
        target: 'all',
        isActive: true
      },
      {
        code: 'HEALTHY20',
        description: '20% off all bowls',
        discountType: 'percentage',
        discountValue: 20,
        minOrderValue: 200000,
        maxDiscountAmount: 100000,
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2026-12-31'),
        maxUses: 200,
        target: 'all',
        isActive: true
      }
    ]);
    console.log('✅ Seeded 3 sample vouchers (WELCOME10, EATOMO50K, HEALTHY20)');
  } else {
    console.log(`ℹ️  Vouchers already exist (${voucherCount} docs)`);
  }

  await mongoose.disconnect();

  console.log('\n🎉 Seed complete! You can now run: npm start');
  console.log('   Admin login: admin / admin123');
  console.log('   User login:  user / user123\n');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
