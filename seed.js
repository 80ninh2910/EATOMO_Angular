/**
 * EATOMO Seed v3
 * node seed.js  (chay tu EATOMO_Angular/)
 * Idempotent — chay lai nhieu lan an toan
 *
 * Tao ra:
 *  - 200 users (sinh tu name arrays)
 *  - 40 bowls (giu nguyen neu da co)
 *  - 10 vouchers (upsert)
 *  - 50 orders cu (ORD-20260312-NNN)
 *  - ~30-50 orders/thang tu Jan 2025 den Mar 2026  (~500+ orders)
 */

const path = require('path');
const BACKEND = path.join(__dirname, 'backend');
require(path.join(BACKEND, 'node_modules', 'dotenv')).config({ path: path.join(BACKEND, '.env') });
const mongoose = require(path.join(BACKEND, 'node_modules', 'mongoose'));
const User    = require(path.join(BACKEND, 'models', 'User'));
const Bowl    = require(path.join(BACKEND, 'models', 'Bowl'));
const Order   = require(path.join(BACKEND, 'models', 'Order'));
const Voucher = require(path.join(BACKEND, 'models', 'Voucher'));

/* ================================================================
 *  SEEDED RANDOM (re-producible, khong thay doi moi lan chay)
 * ================================================================ */
let _seed = 20260312;
function rand() {
  _seed = (_seed * 1664525 + 1013904223) & 0xffffffff;
  return ((_seed >>> 0) / 0xffffffff);
}
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function randInt(min, max) { return min + Math.floor(rand() * (max - min + 1)); }

/* ================================================================
 *  USER GENERATION DATA
 * ================================================================ */
const HO  = ['nguyen','tran','le','pham','hoang','huynh','phan','vu','dang','bui','do','ho','ngo','duong','ly','dinh','vo','cao','doan','mai','trinh','truong','to','luu','dam'];
const DEM = ['van','thi','huu','minh','quoc','dinh','thanh','xuan','thu','hong','kim','ngoc','bao','anh','gia','cong','hai','duc','trung','tuan'];
const TEN = ['an','binh','cuong','dung','phuc','giang','hung','khoa','long','minh','nam','oanh','phuong','quan','son','tam','uy','vinh','xuan','bach','dat','ha','hai','hao','hien','hoa','khanh','lan','liem','mai','nhan','nhung','phat','quy','tho','toan','trang','tuyen','uyen','viet','yen','cat','hoi','luu','tung','trung','duc','huy','thuan','phu','hieu','lam','sang','nhi','thao','suong','huong','loan','chi','nga','bich','diem','uyen','tho','linh','hanh','van'];
const STREETS = [
  '22 Nguyen Hue, Q1, HCM','45 Le Loi, Q1, HCM','100 Tran Hung Dao, Q5, HCM','78 Nguyen Trai, Q5, HCM',
  '15 Vo Van Tan, Q3, HCM','200 Dien Bien Phu, Binh Thanh, HCM','33 Pham Ngoc Thach, Q3, HCM',
  '99 Hai Ba Trung, Q1, HCM','12 Ly Tu Trong, Q1, HCM','88 Nam Ky Khoi Nghia, Q3, HCM',
  '5 Pasteur, Q1, HCM','40 Mac Dinh Chi, Q1, HCM','777 Nguyen Kiem, Phu Nhuan, HCM',
  '38 Nguyen Dinh Chieu, Q3, HCM','66 CMTT, Q10, HCM','10 NTMK, Q1, HCM',
  '56 Pasteur, Q1, HCM','9 Doan Van Bo, Q4, HCM','350 Hoang Dieu, Q4, HCM',
  '18 Ngo Duc Ke, Q1, HCM','300 Nguyen Van Cu, Q5, HCM','150 Cong Hoa, Tan Binh, HCM',
  '25 Bach Dang, Binh Thanh, HCM','88 Xo Viet Nghe Tinh, Binh Thanh, HCM',
  '44 Dien Bien Phu, Q3, HCM','7 Tran Quoc Thao, Q3, HCM','60 Ly Chinh Thang, Q3, HCM',
];
const PHONES = ['090','091','092','093','094','095','096','097','098'];

/* ================================================================
 *  BOWL / VOUCHER / PAYMENT REFERENCE DATA
 * ================================================================ */
const BOWL_POOL = [
  {id:'L1',name:'L1',price:149900},{id:'L2',name:'L2',price:154900},{id:'L3',name:'L3',price:169900},
  {id:'L4',name:'L4',price:139900},{id:'L5',name:'L5',price:159900},{id:'L6',name:'L6',price:144900},
  {id:'L7',name:'L7',price:164900},{id:'L8',name:'L8',price:179900},{id:'L9',name:'L9',price:159900},
  {id:'L10',name:'L10',price:169900},
  {id:'B1',name:'B1',price:189900},{id:'B2',name:'B2',price:174900},{id:'B3',name:'B3',price:164900},
  {id:'B4',name:'B4',price:199900},{id:'B5',name:'B5',price:189900},{id:'B6',name:'B6',price:189900},
  {id:'B7',name:'B7',price:199900},{id:'B8',name:'B8',price:179900},{id:'B9',name:'B9',price:199900},
  {id:'B10',name:'B10',price:219900},{id:'B11',name:'B11',price:189900},{id:'B12',name:'B12',price:209900},
  {id:'B13',name:'B13',price:209900},{id:'B14',name:'B14',price:179900},{id:'B15',name:'B15',price:199900},
  {id:'H1',name:'H1',price:229900},{id:'H2',name:'H2',price:239900},{id:'H3',name:'H3',price:219900},
  {id:'H4',name:'H4',price:249900},{id:'H5',name:'H5',price:269900},{id:'H6',name:'H6',price:249900},
  {id:'H7',name:'H7',price:239900},{id:'H8',name:'H8',price:259900},{id:'H9',name:'H9',price:249900},
  {id:'H10',name:'H10',price:259900},
  {id:'V1',name:'V1',price:129900},{id:'V2',name:'V2',price:149900},{id:'V3',name:'V3',price:139900},
  {id:'V4',name:'V4',price:139900},{id:'V5',name:'V5',price:149900},
];
const VOUCHER_CODES = ['','','','','','WELCOME10','EATOMO50K','HEALTHY20','FREESHIP','FLASH25','VEGGIE25','PROTEIN10'];
const PAYMENTS = ['cash','momo','card','bank_transfer','cash','momo','momo','card'];

function randItems() {
  const numItems = randInt(1, 3);
  const items = [];
  const used = new Set();
  for (let i = 0; i < numItems; i++) {
    let b;
    do { b = pick(BOWL_POOL); } while (used.has(b.id));
    used.add(b.id);
    const qty = randInt(1, 2);
    items.push({ bowlId: b.id, bowlName: b.name, unitPrice: b.price, quantity: qty, subtotal: b.price * qty });
  }
  return items;
}

function makeOrder(orderNum, userId, status, payStatus, voucher, items, address, phone, payment, date) {
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const tax      = Math.round(subtotal * 0.08);
  const shipping = subtotal >= 300000 ? 0 : 25000;
  const discount = voucher ? Math.round(subtotal * 0.1) : 0;
  return {
    orderNumber:     orderNum,
    userId,
    status,
    items,
    subtotal,
    tax,
    shippingFee:     shipping,
    discountAmount:  discount,
    totalAmount:     subtotal + tax + shipping - discount,
    paymentMethod:   payment,
    paymentStatus:   payStatus,
    deliveryAddress: address,
    deliveryPhone:   phone,
    voucherCode:     voucher,
    createdAt:       date
  };
}

function statusForDate(date) {
  const cutoff2 = new Date('2026-02-01');
  const cutoff3 = new Date('2026-03-01');
  if (date < cutoff2) return { status:'completed', payStatus:'paid' };
  if (date < cutoff3) {
    const r = rand();
    if (r < 0.7)  return { status:'completed',  payStatus:'paid'   };
    if (r < 0.85) return { status:'delivering', payStatus:'paid'   };
    if (r < 0.95) return { status:'preparing',  payStatus:'paid'   };
    return             { status:'cancelled',  payStatus:'unpaid' };
  }
  // March 2026
  const r = rand();
  if (r < 0.35) return { status:'pending',    payStatus:'unpaid' };
  if (r < 0.55) return { status:'confirmed',  payStatus: rand() < 0.5 ? 'paid':'unpaid' };
  if (r < 0.70) return { status:'preparing',  payStatus:'paid'   };
  if (r < 0.82) return { status:'delivering', payStatus:'paid'   };
  if (r < 0.92) return { status:'completed',  payStatus:'paid'   };
  return             { status:'cancelled',  payStatus:'unpaid' };
}

/* ================================================================
 *  MAIN
 * ================================================================ */
async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/eatomo_db';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB:', uri, '\n');

  /* ── 1. USERS (target 200) ── */
  console.log('--- [1] USERS ---');
  const coreUsers = [
    { username:'admin',      email:'admin@eatomo.vn',       password:'admin123',     fullName:'Admin EATOMO',           phone:'0283456789', address:'669 QL1A, Thu Duc, HCM',             role:'admin' },
    { username:'user',       email:'user@eatomo.vn',        password:'user123',      fullName:'Nguyen Van A',           phone:'0901234567', address:'22 Nguyen Hue, Q1, HCM',             role:'user'  },
    { username:'lethib',     email:'lethib@gmail.com',      password:'lethi123',     fullName:'Le Thi Be Bu',           phone:'0902345678', address:'45 Le Loi, Q1, HCM',                 role:'user'  },
    { username:'tranvanc',   email:'tranvanc@gmail.com',    password:'tranvan123',   fullName:'Tran Van Cun',           phone:'0903456789', address:'100 Tran Hung Dao, Q5, HCM',         role:'user'  },
    { username:'phamthid',   email:'phamthid@gmail.com',    password:'phamthi123',   fullName:'Pham Thi Dep',           phone:'0904567890', address:'78 Nguyen Trai, Q5, HCM',            role:'user'  },
    { username:'hoangvane',  email:'hoangvane@gmail.com',   password:'hoangvan123',  fullName:'Hoang Van E A',          phone:'0905678901', address:'15 Vo Van Tan, Q3, HCM',             role:'user'  },
    { username:'nguyenthif', email:'nguyenthif@gmail.com',  password:'nguyenthi123', fullName:'Nguyen Thi Phi Pheo',    phone:'0906789012', address:'200 Dien Bien Phu, Binh Thanh, HCM', role:'user'  },
    { username:'vuvang',     email:'vuvang@gmail.com',      password:'vuvan123',     fullName:'Vu Van Gay',             phone:'0907890123', address:'33 Pham Ngoc Thach, Q3, HCM',        role:'user'  },
    { username:'buitihhung', email:'buihing@gmail.com',     password:'buihing123',   fullName:'Bui Thi Hung',           phone:'0908901234', address:'99 Hai Ba Trung, Q1, HCM',           role:'user'  },
    { username:'dangvanik',  email:'dangvanik@gmail.com',   password:'dangvan123',   fullName:'Dang Van I Oi',          phone:'0909012345', address:'12 Ly Tu Trong, Q1, HCM',            role:'user'  },
    { username:'lekimkhoe',  email:'lekimkhoe@gmail.com',   password:'lekim123',     fullName:'Le Kim Khoe Re',         phone:'0910123456', address:'88 Nam Ky Khoi Nghia, Q3, HCM',      role:'user'  },
    { username:'ngovanluong',email:'ngovanluong@gmail.com', password:'ngovan123',    fullName:'Ngo Van Luong Bong',     phone:'0911234567', address:'5 Pasteur, Q1, HCM',                 role:'user'  },
    { username:'phanmymy',   email:'phanmymy@gmail.com',    password:'phanmy123',    fullName:'Phan My My',             phone:'0912345678', address:'40 Mac Dinh Chi, Q1, HCM',           role:'user'  },
    { username:'truongnon',  email:'truongnon@gmail.com',   password:'truong123',    fullName:'Truong Van Non Choet',   phone:'0913456789', address:'777 Nguyen Kiem, Phu Nhuan, HCM',    role:'user'  },
    { username:'vothioanh',  email:'vothioanh@gmail.com',   password:'vothi123',     fullName:'Vo Thi Oanh Oach',       phone:'0914567890', address:'38 Nguyen Dinh Chieu, Q3, HCM',      role:'user'  },
    { username:'dohuuphuc',  email:'dohuuphuc@gmail.com',   password:'dohuu123',     fullName:'Do Huu Phuc Beo',        phone:'0915678901', address:'66 CMTT, Q10, HCM',                  role:'user'  },
  ];

  const userIds = [];
  for (const u of coreUsers) {
    let doc = await User.findOne({ username: u.username });
    if (!doc) { doc = await User.create(u); process.stdout.write('+'); }
    else process.stdout.write('.');
    if (u.role === 'user') userIds.push({ id: doc._id, address: u.address, phone: u.phone });
  }

  // Generate up to 200 users total
  let generated = 0;
  outer: for (let hi = 0; hi < HO.length; hi++) {
    for (let di = 0; di < DEM.length; di++) {
      for (let ti = 0; ti < TEN.length; ti++) {
        if (userIds.length >= 200) break outer;
        const username = HO[hi] + DEM[di] + TEN[ti];
        const email    = username + '@gmail.com';
        let doc = await User.findOne({ username });
        if (!doc) {
          const phone = pick(PHONES) + String(randInt(1000000, 9999999));
          const addr  = pick(STREETS);
          doc = await User.create({
            username,
            email,
            password: username + '123',
            fullName: HO[hi].charAt(0).toUpperCase() + HO[hi].slice(1) + ' ' +
                      DEM[di].charAt(0).toUpperCase() + DEM[di].slice(1) + ' ' +
                      TEN[ti].charAt(0).toUpperCase() + TEN[ti].slice(1),
            phone, address: addr, role: 'user'
          });
          generated++;
          process.stdout.write(generated % 20 === 0 ? '\n  ' : '+');
        }
        userIds.push({ id: doc._id, address: doc.address, phone: doc.phone });
      }
    }
  }
  const totalUsers = await User.countDocuments();
  console.log('\n  --> Users trong DB: ' + totalUsers + ' (' + generated + ' moi)\n');

  /* ── 2. BOWLS ── */
  console.log('--- [2] BOWLS ---');
  const bowlCount = await Bowl.countDocuments();
  if (bowlCount === 0) {
    await Bowl.insertMany([
      {_id:'L1', name:'L1', description:'Half beef steak, sweet potato, cauliflower, pickles',                           price:149900,calories:274,protein:25,carbs:27,fat:7, category:'low-cal',     image:'/assets/healthy/images/index/bowl-b1.jpg',isFeatured:false},
      {_id:'L2', name:'L2', description:'Salmon, sweet potato, mixed veggies, pak choi',                                 price:154900,calories:331,protein:24,carbs:26,fat:15,category:'low-cal',     image:'/assets/healthy/images/index/bowl-b2.jpg',isFeatured:false},
      {_id:'L3', name:'L3', description:'Prawns, Japanese cold soba, onsen egg, pickles',                                price:169900,calories:341,protein:32,carbs:35,fat:8, category:'low-cal',     image:'/assets/healthy/images/index/bowl-b3.jpg',isFeatured:true },
      {_id:'L4', name:'L4', description:'Half chicken breast, baby potato, mixed veggies, pak choi',                     price:139900,calories:285,protein:33,carbs:23,fat:7, category:'low-cal',     image:'/assets/healthy/images/index/bowl-b4.jpg',isFeatured:false},
      {_id:'L5', name:'L5', description:'Half cajun chicken, Japanese cold soba, pickles, cauliflower',                  price:159900,calories:351,protein:39,carbs:40,fat:4, category:'low-cal',     image:'/assets/healthy/images/index/bowl-b5.jpg',isFeatured:false},
      {_id:'L6', name:'L6', description:'Tuna, baby potato, sweet corn, mixed veggies',                                  price:144900,calories:311,protein:34,carbs:32,fat:5, category:'low-cal',     image:'/assets/healthy/images/index/bowl-b6.jpg',isFeatured:false},
      {_id:'L7', name:'L7', description:'Half cajun chicken breast, brown rice, beetroot, tomato',                       price:164900,calories:373,protein:35,carbs:45,fat:6, category:'low-cal',     image:'/assets/healthy/images/index/bowl-b1.jpg',isFeatured:false},
      {_id:'L8', name:'L8', description:'Basa fish, Japanese cold soba, avocado',                                        price:179900,calories:439,protein:33,carbs:40,fat:16,category:'low-cal',     image:'/assets/healthy/images/index/bowl-b2.jpg',isFeatured:false},
      {_id:'L9', name:'L9', description:'Half beef steak, sweet potato, pak choi, broccoli, mixed veggies',              price:159900,calories:341,protein:27,carbs:33,fat:11,category:'low-cal',     image:'/assets/healthy/images/index/bowl-b3.jpg',isFeatured:false},
      {_id:'L10',name:'L10',description:'Duck breast, pumpkin, broccoli, spinach',                                       price:169900,calories:351,protein:35,carbs:16,fat:16,category:'low-cal',     image:'/assets/healthy/images/index/bowl-b4.jpg',isFeatured:false},
      {_id:'B1', name:'B1', description:'Tuna, donburi brown rice, beetroot, broccoli',                                  price:189900,calories:434,protein:43,carbs:48,fat:8, category:'balanced',    image:'/assets/healthy/images/index/bowl-b5.jpg',isFeatured:false},
      {_id:'B2', name:'B2', description:'Half beef steak, pasta, mushroom, pak choi, pickles, onsen egg',                price:174900,calories:438,protein:35,carbs:38,fat:16,category:'balanced',    image:'/assets/healthy/images/index/bowl-b6.jpg',isFeatured:false},
      {_id:'B3', name:'B3', description:'Prawns, Japanese cold soba, French bean, tofu',                                 price:164900,calories:435,protein:41,carbs:54,fat:6, category:'balanced',    image:'/assets/healthy/images/index/bowl-b1.jpg',isFeatured:false},
      {_id:'B4', name:'B4', description:'Salmon, pasta, spinach, salad and mixed nuts',                                  price:199900,calories:508,protein:31,carbs:42,fat:24,category:'balanced',    image:'/assets/healthy/images/index/bowl-b2.jpg',isFeatured:true },
      {_id:'B5', name:'B5', description:'Duck breast, donburi brown rice, pickles',                                      price:189900,calories:485,protein:40,carbs:36,fat:20,category:'balanced',    image:'/assets/healthy/images/index/bowl-b3.jpg',isFeatured:false},
      {_id:'B6', name:'B6', description:'Salmon, donburi brown rice, spinach',                                           price:189900,calories:455,protein:32,carbs:38,fat:20,category:'balanced',    image:'/assets/healthy/images/index/bowl-b4.jpg',isFeatured:false},
      {_id:'B7', name:'B7', description:'Duck breast, donburi white rice, mixed veggies, spinach',                       price:199900,calories:586,protein:42,carbs:49,fat:25,category:'balanced',    image:'/assets/healthy/images/index/bowl-b5.jpg',isFeatured:false},
      {_id:'B8', name:'B8', description:'Basa fish, donburi brown rice, spinach, cabbage',                               price:179900,calories:442,protein:37,carbs:43,fat:14,category:'balanced',    image:'/assets/healthy/images/index/bowl-b6.jpg',isFeatured:false},
      {_id:'B9', name:'B9', description:'Half original chicken, prawns, donburi brown rice, French bean',                price:199900,calories:488,protein:58,carbs:39,fat:11,category:'balanced',    image:'/assets/healthy/images/index/bowl-b1.jpg',isFeatured:false},
      {_id:'B10',name:'B10',description:'Full beef steak, donburi brown rice, cauliflower',                              price:219900,calories:557,protein:54,carbs:41,fat:20,category:'balanced',    image:'/assets/healthy/images/index/bowl-b2.jpg',isFeatured:false},
      {_id:'B11',name:'B11',description:'Tuna, donburi white rice, broccoli, pickles',                                   price:189900,calories:437,protein:42,carbs:52,fat:7, category:'balanced',    image:'/assets/healthy/images/index/bowl-b3.jpg',isFeatured:false},
      {_id:'B12',name:'B12',description:'Full cajun chicken, brown rice, sweet corn, tomato',                            price:209900,calories:542,protein:65,carbs:52,fat:8, category:'balanced',    image:'/assets/healthy/images/index/bowl-b4.jpg',isFeatured:false},
      {_id:'B13',name:'B13',description:'Full cajun chicken, baby potato, spinach, broccoli',                            price:209900,calories:440,protein:64,carbs:27,fat:9, category:'balanced',    image:'/assets/healthy/images/index/bowl-b5.jpg',isFeatured:false},
      {_id:'B14',name:'B14',description:'Basa fish, donburi brown rice, cabbage, tomato',                                price:179900,calories:441,protein:36,carbs:46,fat:12,category:'balanced',    image:'/assets/healthy/images/index/bowl-b6.jpg',isFeatured:false},
      {_id:'B15',name:'B15',description:'Half beef steak, prawns, soba, cauliflower, pickles, onsen egg',                price:199900,calories:515,protein:55,carbs:41,fat:15,category:'balanced',    image:'/assets/healthy/images/index/bowl-b1.jpg',isFeatured:false},
      {_id:'H1', name:'H1', description:'Half original chicken, half beef steak, donburi brown rice, spinach',           price:229900,calories:562,protein:62,carbs:38,fat:18,category:'high-protein',image:'/assets/healthy/images/index/bowl-b2.jpg',isFeatured:true },
      {_id:'H2', name:'H2', description:'Half beef steak, prawns, donburi white rice, baby potato, broccoli',            price:239900,calories:615,protein:53,carbs:69,fat:14,category:'high-protein',image:'/assets/healthy/images/index/bowl-b3.jpg',isFeatured:false},
      {_id:'H3', name:'H3', description:'Basa fish, Japanese cold soba, avocado, mixed veggies, onsen egg',              price:219900,calories:560,protein:39,carbs:44,fat:25,category:'high-protein',image:'/assets/healthy/images/index/bowl-b4.jpg',isFeatured:false},
      {_id:'H4', name:'H4', description:'Duck breast, prawns, sweet potato, edamame, onsen egg',                         price:249900,calories:584,protein:66,carbs:33,fat:21,category:'high-protein',image:'/assets/healthy/images/index/bowl-b5.jpg',isFeatured:false},
      {_id:'H5', name:'H5', description:'Half beef steak, full chicken breast, donburi brown rice, pumpkin, french bean', price:269900,calories:720,protein:91,carbs:46,fat:19,category:'high-protein',image:'/assets/healthy/images/index/bowl-b6.jpg',isFeatured:false},
      {_id:'H6', name:'H6', description:'Full original chicken, fusilli pasta, avocado, beetroot',                       price:249900,calories:611,protein:65,carbs:45,fat:19,category:'high-protein',image:'/assets/healthy/images/index/bowl-b1.jpg',isFeatured:false},
      {_id:'H7', name:'H7', description:'Half beef steak, half cajun chicken breast, donburi brown, sweet corn',         price:239900,calories:583,protein:62,carbs:47,fat:16,category:'high-protein',image:'/assets/healthy/images/index/bowl-b2.jpg',isFeatured:false},
      {_id:'H8', name:'H8', description:'Full beef steak, donburi brown rice, baby potato, broccoli',                    price:259900,calories:649,protein:56,carbs:60,fat:21,category:'high-protein',image:'/assets/healthy/images/index/bowl-b3.jpg',isFeatured:false},
      {_id:'H9', name:'H9', description:'Full beef steak, donburi white rice, sweet corn',                               price:249900,calories:611,protein:54,carbs:56,fat:19,category:'high-protein',image:'/assets/healthy/images/index/bowl-b4.jpg',isFeatured:false},
      {_id:'H10',name:'H10',description:'Half cajun chicken breast, salmon, donburi white rice, tomato',                 price:259900,calories:617,protein:60,carbs:50,fat:20,category:'high-protein',image:'/assets/healthy/images/index/bowl-b5.jpg',isFeatured:false},
      {_id:'V1', name:'V1', description:'Brown rice, cauliflower, mixed veggies, edamame, mushroom',                     price:129900,calories:377,protein:18,carbs:55,fat:10,category:'vegetarian',  image:'/assets/healthy/images/index/bowl-b6.jpg',isFeatured:false},
      {_id:'V2', name:'V2', description:'Japanese cold soba, cabbage, chickpeas, beetroot, avocado',                     price:149900,calories:536,protein:19,carbs:74,fat:18,category:'vegetarian',  image:'/assets/healthy/images/index/bowl-b1.jpg',isFeatured:true },
      {_id:'V3', name:'V3', description:'White rice, sweet potato, avocado, sweet corn, spinach',                        price:139900,calories:520,protein:11,carbs:84,fat:16,category:'vegetarian',  image:'/assets/healthy/images/index/bowl-b2.jpg',isFeatured:false},
      {_id:'V4', name:'V4', description:'Brown rice, chickpeas, tomato, avocado, french bean',                           price:139900,calories:520,protein:16,carbs:75,fat:18,category:'vegetarian',  image:'/assets/healthy/images/index/bowl-b3.jpg',isFeatured:false},
      {_id:'V5', name:'V5', description:'Tofu, pasta, broccoli, edamame, purple cabbage, beetroot',                      price:149900,calories:530,protein:33,carbs:85,fat:7, category:'vegetarian',  image:'/assets/healthy/images/index/bowl-b4.jpg',isFeatured:false},
    ]);
    console.log('  [+] Seeded 40 bowls');
  } else {
    console.log('  [i] Bowls da co (' + bowlCount + ' docs)');
  }
  console.log('');

  /* ── 3. VOUCHERS ── */
  console.log('--- [3] VOUCHERS ---');
  const vouchersData = [
    {code:'WELCOME10',   description:'Chao khach hang moi - giam 10%, toi da 50k',        discountType:'percentage',discountValue:10, minOrderValue:0,      maxDiscountAmount:50000, validFrom:new Date('2025-01-01'),validUntil:new Date('2027-12-31'),maxUses:9999,currentUses:38, target:'new_customer',     isActive:true},
    {code:'FIRSTORDER30',description:'Giam 30% don dau tien - toi da 120k',               discountType:'percentage',discountValue:30, minOrderValue:0,      maxDiscountAmount:120000,validFrom:new Date('2025-01-01'),validUntil:new Date('2027-12-31'),maxUses:9999,currentUses:215,target:'new_customer',     isActive:true},
    {code:'EATOMO50K',   description:'Giam thang 50k - don tu 300k',                      discountType:'fixed',     discountValue:50000,minOrderValue:300000,                        validFrom:new Date('2025-01-01'),validUntil:new Date('2027-12-31'),maxUses:500, currentUses:122,target:'all',              isActive:true},
    {code:'HEALTHY20',   description:'Giam 20% tat ca bowl - don tu 200k, toi da 100k',   discountType:'percentage',discountValue:20, minOrderValue:200000, maxDiscountAmount:100000,validFrom:new Date('2025-01-01'),validUntil:new Date('2027-12-31'),maxUses:200, currentUses:74, target:'all',              isActive:true},
    {code:'FLASH25',     description:'Flash sale 48h - giam 25%, don tu 150k, toi da 80k',discountType:'percentage',discountValue:25, minOrderValue:150000, maxDiscountAmount:80000, validFrom:new Date('2026-03-12'),validUntil:new Date('2026-03-14'),maxUses:100, currentUses:3,  target:'all',              isActive:true},
    {code:'FREESHIP',    description:'Mien phi van chuyen 25k - don tu 100k',              discountType:'fixed',     discountValue:25000,minOrderValue:100000,                        validFrom:new Date('2025-06-01'),validUntil:new Date('2027-12-31'),maxUses:9999,currentUses:340,target:'all',              isActive:true},
    {code:'VIP100K',     description:'VIP reward - giam 100k cho don tu 500k',             discountType:'fixed',     discountValue:100000,minOrderValue:500000,                       validFrom:new Date('2025-01-01'),validUntil:new Date('2027-12-31'),maxUses:100, currentUses:11, target:'vip',              isActive:true},
    {code:'SUMMER15',    description:'Khuyen mai he - giam 15%, don tu 150k, toi da 80k',  discountType:'percentage',discountValue:15, minOrderValue:150000, maxDiscountAmount:80000, validFrom:new Date('2026-06-01'),validUntil:new Date('2026-08-31'),maxUses:300, currentUses:0,  target:'all',              isActive:true},
    {code:'VEGGIE25',    description:'Giam 25% bowl chay - don tu 100k, toi da 75k',      discountType:'percentage',discountValue:25, minOrderValue:100000, maxDiscountAmount:75000, validFrom:new Date('2026-03-01'),validUntil:new Date('2026-09-30'),maxUses:200, currentUses:5,  target:'specific_category',targetCategory:'vegetarian',  isActive:true},
    {code:'PROTEIN10',   description:'Giam 10% bowl nhieu dam - don tu 250k, toi da 60k', discountType:'percentage',discountValue:10, minOrderValue:250000, maxDiscountAmount:60000, validFrom:new Date('2026-01-01'),validUntil:new Date('2026-12-31'),maxUses:500, currentUses:33, target:'specific_category',targetCategory:'high-protein',isActive:true},
  ];
  let newV = 0;
  for (const v of vouchersData) {
    if (!(await Voucher.findOne({ code: v.code }))) { await Voucher.create(v); newV++; }
  }
  console.log('  --> ' + (newV ? newV + ' vouchers moi' : 'tat ca da ton tai') + '\n');

  /* ── 4. ORDERS CU (50) ── */
  console.log('--- [4] ORDERS CU (50) ---');
  function pad(n) { return String(n).padStart(3,'0'); }
  const u = {};
  for (const cu of coreUsers) { u[cu.username] = await User.findOne({ username: cu.username }); }

  function coreOrder(num,userId,status,items,address,phone,payment,payStatus,voucherCode,daysAgo) {
    voucherCode = voucherCode || ''; daysAgo = daysAgo || 0;
    const date = new Date(); date.setDate(date.getDate() - daysAgo);
    return makeOrder('ORD-20260312-' + pad(num), userId, status, payStatus, voucherCode, items, address, phone, payment, date);
  }

  const coreOrders = [
    coreOrder( 1,u.user._id,       'completed',[{bowlId:'B4', bowlName:'B4', unitPrice:199900,quantity:2,subtotal:399800},{bowlId:'L3',bowlName:'L3',unitPrice:169900,quantity:1,subtotal:169900}],'22 Nguyen Hue, Q1, HCM',     '0901234567','momo',         'paid',   'WELCOME10',   30),
    coreOrder( 2,u.lethib._id,     'completed',[{bowlId:'H1', bowlName:'H1', unitPrice:229900,quantity:1,subtotal:229900}],                                                                        '45 Le Loi, Q1, HCM',         '0902345678','cash',         'paid',   '',            28),
    coreOrder( 3,u.tranvanc._id,   'completed',[{bowlId:'B10',bowlName:'B10',unitPrice:219900,quantity:1,subtotal:219900},{bowlId:'V2',bowlName:'V2',unitPrice:149900,quantity:2,subtotal:299800}],'100 Tran Hung Dao, Q5, HCM', '0903456789','card',         'paid',   'EATOMO50K',   27),
    coreOrder( 4,u.phamthid._id,   'completed',[{bowlId:'L4', bowlName:'L4', unitPrice:139900,quantity:3,subtotal:419700}],                                                                        '78 Nguyen Trai, Q5, HCM',    '0904567890','momo',         'paid',   '',            26),
    coreOrder( 5,u.hoangvane._id,  'completed',[{bowlId:'H5', bowlName:'H5', unitPrice:269900,quantity:2,subtotal:539800},{bowlId:'B6',bowlName:'B6',unitPrice:189900,quantity:1,subtotal:189900}],'15 Vo Van Tan, Q3, HCM',     '0905678901','bank_transfer','paid',   'VIP100K',     25),
    coreOrder( 6,u.nguyenthif._id, 'completed',[{bowlId:'V3', bowlName:'V3', unitPrice:139900,quantity:2,subtotal:279800},{bowlId:'V5',bowlName:'V5',unitPrice:149900,quantity:1,subtotal:149900}],'200 DBP, Binh Thanh, HCM',   '0906789012','cash',         'paid',   'VEGGIE25',    24),
    coreOrder( 7,u.vuvang._id,     'completed',[{bowlId:'B3', bowlName:'B3', unitPrice:164900,quantity:1,subtotal:164900},{bowlId:'H3',bowlName:'H3',unitPrice:219900,quantity:1,subtotal:219900}],'33 PNT, Q3, HCM',            '0907890123','momo',         'paid',   '',            23),
    coreOrder( 8,u.user._id,       'completed',[{bowlId:'H7', bowlName:'H7', unitPrice:239900,quantity:2,subtotal:479800}],                                                                        '22 Nguyen Hue, Q1, HCM',     '0901234567','card',         'paid',   'HEALTHY20',   22),
    coreOrder( 9,u.lethib._id,     'completed',[{bowlId:'B1', bowlName:'B1', unitPrice:189900,quantity:2,subtotal:379800},{bowlId:'L6',bowlName:'L6',unitPrice:144900,quantity:1,subtotal:144900}],'45 Le Loi, Q1, HCM',         '0902345678','cash',         'paid',   '',            21),
    coreOrder(10,u.buitihhung._id, 'completed',[{bowlId:'B12',bowlName:'B12',unitPrice:209900,quantity:2,subtotal:419800}],                                                                        '99 HBT, Q1, HCM',            '0908901234','momo',         'paid',   'FIRSTORDER30',20),
    coreOrder(11,u.dangvanik._id,  'completed',[{bowlId:'L2', bowlName:'L2', unitPrice:154900,quantity:1,subtotal:154900},{bowlId:'H10',bowlName:'H10',unitPrice:259900,quantity:1,subtotal:259900}],'12 LTT, Q1, HCM',           '0909012345','card',         'paid',   '',            19),
    coreOrder(12,u.lekimkhoe._id,  'completed',[{bowlId:'V4', bowlName:'V4', unitPrice:139900,quantity:3,subtotal:419700},{bowlId:'V1',bowlName:'V1',unitPrice:129900,quantity:1,subtotal:129900}],'88 NKKN, Q3, HCM',           '0910123456','cash',         'paid',   'VEGGIE25',    18),
    coreOrder(13,u.ngovanluong._id,'completed',[{bowlId:'H8', bowlName:'H8', unitPrice:259900,quantity:1,subtotal:259900},{bowlId:'H2',bowlName:'H2',unitPrice:239900,quantity:1,subtotal:239900}],'5 Pasteur, Q1, HCM',         '0911234567','bank_transfer','paid',   'PROTEIN10',   17),
    coreOrder(14,u.phanmymy._id,   'completed',[{bowlId:'B9', bowlName:'B9', unitPrice:199900,quantity:2,subtotal:399800}],                                                                        '40 MDC, Q1, HCM',            '0912345678','momo',         'paid',   'EATOMO50K',   16),
    coreOrder(15,u.truongnon._id,  'completed',[{bowlId:'L8', bowlName:'L8', unitPrice:179900,quantity:2,subtotal:359800},{bowlId:'B5',bowlName:'B5',unitPrice:189900,quantity:1,subtotal:189900}],'777 NK, PN, HCM',            '0913456789','cash',         'paid',   '',            15),
    coreOrder(16,u.vothioanh._id,  'completed',[{bowlId:'H6', bowlName:'H6', unitPrice:249900,quantity:2,subtotal:499800}],                                                                        '38 NDC, Q3, HCM',            '0914567890','card',         'paid',   'VIP100K',     14),
    coreOrder(17,u.dohuuphuc._id,  'completed',[{bowlId:'B4', bowlName:'B4', unitPrice:199900,quantity:1,subtotal:199900},{bowlId:'L5',bowlName:'L5',unitPrice:159900,quantity:2,subtotal:319800}],'66 CMTT, Q10, HCM',          '0915678901','momo',         'paid',   'HEALTHY20',   13),
    coreOrder(18,u.buitihhung._id, 'completed',[{bowlId:'B15',bowlName:'B15',unitPrice:199900,quantity:2,subtotal:399800}],                                                                        '99 HBT, Q1, HCM',            '0908901234','cash',         'paid',   '',            12),
    coreOrder(19,u.phamthid._id,   'completed',[{bowlId:'H4', bowlName:'H4', unitPrice:249900,quantity:1,subtotal:249900},{bowlId:'B7',bowlName:'B7',unitPrice:199900,quantity:1,subtotal:199900}],'56 Pasteur, Q1, HCM',        '0904567890','card',         'paid',   'EATOMO50K',   11),
    coreOrder(20,u.user._id,       'completed',[{bowlId:'H9', bowlName:'H9', unitPrice:249900,quantity:1,subtotal:249900}],                                                                        '22 Nguyen Hue, Q1, HCM',     '0901234567','momo',         'paid',   '',            10),
    coreOrder(21,u.lekimkhoe._id,  'completed',[{bowlId:'B11',bowlName:'B11',unitPrice:189900,quantity:2,subtotal:379800},{bowlId:'L1',bowlName:'L1',unitPrice:149900,quantity:1,subtotal:149900}],'88 NKKN, Q3, HCM',           '0910123456','cash',         'paid',   'FREESHIP',     9),
    coreOrder(22,u.dangvanik._id,  'completed',[{bowlId:'V2', bowlName:'V2', unitPrice:149900,quantity:2,subtotal:299800},{bowlId:'V5',bowlName:'V5',unitPrice:149900,quantity:1,subtotal:149900}],'12 LTT, Q1, HCM',            '0909012345','momo',         'paid',   'VEGGIE25',     8),
    coreOrder(23,u.tranvanc._id,   'delivering',[{bowlId:'H8',bowlName:'H8',unitPrice:259900,quantity:1,subtotal:259900},{bowlId:'B9',bowlName:'B9',unitPrice:199900,quantity:1,subtotal:199900}], '100 THD, Q5, HCM',           '0903456789','momo',         'paid',   'PROTEIN10',    1),
    coreOrder(24,u.phamthid._id,   'delivering',[{bowlId:'L2',bowlName:'L2',unitPrice:154900,quantity:2,subtotal:309800}],                                                                         '56 Pasteur, Q1, HCM',        '0904567890','cash',         'unpaid', '',             1),
    coreOrder(25,u.ngovanluong._id,'delivering',[{bowlId:'B4',bowlName:'B4',unitPrice:199900,quantity:2,subtotal:399800},{bowlId:'H1',bowlName:'H1',unitPrice:229900,quantity:1,subtotal:229900}],  '5 Pasteur, Q1, HCM',         '0911234567','card',         'paid',   'EATOMO50K',    1),
    coreOrder(26,u.phanmymy._id,   'delivering',[{bowlId:'V3',bowlName:'V3',unitPrice:139900,quantity:2,subtotal:279800}],                                                                         '40 MDC, Q1, HCM',            '0912345678','momo',         'paid',   'VEGGIE25',     1),
    coreOrder(27,u.truongnon._id,  'delivering',[{bowlId:'H5',bowlName:'H5',unitPrice:269900,quantity:1,subtotal:269900},{bowlId:'L9',bowlName:'L9',unitPrice:159900,quantity:1,subtotal:159900}],  '777 NK, PN, HCM',            '0913456789','bank_transfer','paid',   '',             1),
    coreOrder(28,u.vothioanh._id,  'delivering',[{bowlId:'B13',bowlName:'B13',unitPrice:209900,quantity:2,subtotal:419800}],                                                                        '38 NDC, Q3, HCM',            '0914567890','momo',         'paid',   'HEALTHY20',    0),
    coreOrder(29,u.lethib._id,     'delivering',[{bowlId:'H3',bowlName:'H3',unitPrice:219900,quantity:1,subtotal:219900},{bowlId:'B6',bowlName:'B6',unitPrice:189900,quantity:1,subtotal:189900}],  '45 Le Loi, Q1, HCM',         '0902345678','cash',         'unpaid', '',             0),
    coreOrder(30,u.dohuuphuc._id,  'delivering',[{bowlId:'B10',bowlName:'B10',unitPrice:219900,quantity:2,subtotal:439800}],                                                                        '66 CMTT, Q10, HCM',          '0915678901','card',         'paid',   'EATOMO50K',    0),
    coreOrder(31,u.hoangvane._id,  'preparing', [{bowlId:'B12',bowlName:'B12',unitPrice:209900,quantity:1,subtotal:209900},{bowlId:'H10',bowlName:'H10',unitPrice:259900,quantity:1,subtotal:259900}],'15 VVT, Q3, HCM',           '0905678901','card',         'paid',   '',             0),
    coreOrder(32,u.vuvang._id,     'preparing', [{bowlId:'V4',bowlName:'V4',unitPrice:139900,quantity:3,subtotal:419700},{bowlId:'V1',bowlName:'V1',unitPrice:129900,quantity:1,subtotal:129900}],   '12 CMTT, Q10, HCM',          '0907890123','momo',         'paid',   'VEGGIE25',     0),
    coreOrder(33,u.buitihhung._id, 'preparing', [{bowlId:'H2',bowlName:'H2',unitPrice:239900,quantity:1,subtotal:239900},{bowlId:'B1',bowlName:'B1',unitPrice:189900,quantity:2,subtotal:379800}],   '99 HBT, Q1, HCM',            '0908901234','cash',         'paid',   '',             0),
    coreOrder(34,u.lekimkhoe._id,  'preparing', [{bowlId:'H6',bowlName:'H6',unitPrice:249900,quantity:1,subtotal:249900},{bowlId:'L7',bowlName:'L7',unitPrice:164900,quantity:2,subtotal:329800}],   '88 NKKN, Q3, HCM',           '0910123456','momo',         'paid',   'PROTEIN10',    0),
    coreOrder(35,u.ngovanluong._id,'preparing', [{bowlId:'B8',bowlName:'B8',unitPrice:179900,quantity:2,subtotal:359800}],                                                                            '5 Pasteur, Q1, HCM',         '0911234567','card',         'paid',   'FREESHIP',     0),
    coreOrder(36,u.user._id,       'preparing', [{bowlId:'H4',bowlName:'H4',unitPrice:249900,quantity:2,subtotal:499800}],                                                                            '22 Nguyen Hue, Q1, HCM',     '0901234567','momo',         'paid',   'FLASH25',      0),
    coreOrder(37,u.phanmymy._id,   'preparing', [{bowlId:'L5',bowlName:'L5',unitPrice:159900,quantity:2,subtotal:319800},{bowlId:'B3',bowlName:'B3',unitPrice:164900,quantity:1,subtotal:164900}],   '40 MDC, Q1, HCM',            '0912345678','cash',         'unpaid', '',             0),
    coreOrder(38,u.truongnon._id,  'preparing', [{bowlId:'B14',bowlName:'B14',unitPrice:179900,quantity:3,subtotal:539700}],                                                                          '777 NK, PN, HCM',            '0913456789','bank_transfer','paid',   'EATOMO50K',    0),
    coreOrder(39,u.nguyenthif._id, 'confirmed', [{bowlId:'B7',bowlName:'B7',unitPrice:199900,quantity:2,subtotal:399800}],                                                                            '200 DBP, BThanh, HCM',       '0906789012','momo',         'paid',   '',             0),
    coreOrder(40,u.user._id,       'confirmed', [{bowlId:'L7',bowlName:'L7',unitPrice:164900,quantity:1,subtotal:164900},{bowlId:'B11',bowlName:'B11',unitPrice:189900,quantity:1,subtotal:189900}],  '22 Nguyen Hue, Q1, HCM',     '0901234567','cash',         'unpaid', '',             0),
    coreOrder(41,u.vothioanh._id,  'confirmed', [{bowlId:'H9',bowlName:'H9',unitPrice:249900,quantity:1,subtotal:249900},{bowlId:'B2',bowlName:'B2',unitPrice:174900,quantity:1,subtotal:174900}],    '38 NDC, Q3, HCM',            '0914567890','card',         'paid',   'HEALTHY20',    0),
    coreOrder(42,u.dohuuphuc._id,  'confirmed', [{bowlId:'V2',bowlName:'V2',unitPrice:149900,quantity:2,subtotal:299800},{bowlId:'V4',bowlName:'V4',unitPrice:139900,quantity:1,subtotal:139900}],    '66 CMTT, Q10, HCM',          '0915678901','momo',         'unpaid', '',             0),
    coreOrder(43,u.dangvanik._id,  'confirmed', [{bowlId:'B5',bowlName:'B5',unitPrice:189900,quantity:2,subtotal:379800}],                                                                            '12 LTT, Q1, HCM',            '0909012345','cash',         'paid',   'FREESHIP',     0),
    coreOrder(44,u.lethib._id,     'confirmed', [{bowlId:'H7',bowlName:'H7',unitPrice:239900,quantity:1,subtotal:239900},{bowlId:'L10',bowlName:'L10',unitPrice:169900,quantity:1,subtotal:169900}],  '45 Le Loi, Q1, HCM',         '0902345678','momo',         'unpaid', '',             0),
    coreOrder(45,u.lethib._id,     'pending',   [{bowlId:'H4',bowlName:'H4',unitPrice:249900,quantity:1,subtotal:249900},{bowlId:'L9',bowlName:'L9',unitPrice:159900,quantity:2,subtotal:319800}],    '45 Le Loi, Q1, HCM',         '0902345678','momo',         'unpaid', '',             0),
    coreOrder(46,u.tranvanc._id,   'pending',   [{bowlId:'B5',bowlName:'B5',unitPrice:189900,quantity:2,subtotal:379800},{bowlId:'V2',bowlName:'V2',unitPrice:149900,quantity:1,subtotal:149900}],    '100 THD, Q5, HCM',           '0903456789','card',         'unpaid', 'FIRSTORDER30', 0),
    coreOrder(47,u.buitihhung._id, 'pending',   [{bowlId:'B15',bowlName:'B15',unitPrice:199900,quantity:2,subtotal:399800}],                                                                          '10 NTMK, Q1, HCM',           '0908901234','bank_transfer','unpaid', '',             0),
    coreOrder(48,u.phanmymy._id,   'pending',   [{bowlId:'H10',bowlName:'H10',unitPrice:259900,quantity:1,subtotal:259900},{bowlId:'L3',bowlName:'L3',unitPrice:169900,quantity:1,subtotal:169900}],  '40 MDC, Q1, HCM',            '0912345678','momo',         'unpaid', 'FLASH25',      0),
    coreOrder(49,u.hoangvane._id,  'cancelled', [{bowlId:'H2',bowlName:'H2',unitPrice:239900,quantity:1,subtotal:239900}],                                                                            '15 VVT, Q3, HCM',            '0905678901','cash',         'unpaid', '',             3),
    coreOrder(50,u.user._id,       'cancelled', [{bowlId:'L10',bowlName:'L10',unitPrice:169900,quantity:2,subtotal:339800},{bowlId:'B2',bowlName:'B2',unitPrice:174900,quantity:1,subtotal:174900}],  '9 DVB, Q4, HCM',             '0901234567','momo',         'refunded','',            5),
  ];
  let cOrders = 0;
  for (const o of coreOrders) {
    if (!(await Order.findOne({ orderNumber: o.orderNumber }))) { await Order.create(o); cOrders++; }
  }
  console.log('  --> ' + (cOrders ? cOrders + ' orders moi' : 'tat ca da ton tai') + '\n');

  /* ── 5. MONTHLY ORDERS Jan 2025 → Mar 2026 ── */
  console.log('--- [5] MONTHLY ORDERS (Jan 2025 - Mar 2026) ---');
  const months = [];
  for (let y = 2025; y <= 2026; y++) {
    const mMax = (y === 2026) ? 3 : 12;
    for (let m = 1; m <= mMax; m++) months.push({ y, m });
  }

  let totalMonthly = 0;
  for (const { y, m } of months) {
    const mm    = String(m).padStart(2,'0');
    const count = randInt(30, 50);
    const daysInMonth = new Date(y, m, 0).getDate();
    let added = 0;

    for (let seq = 1; seq <= count; seq++) {
      const orderNum = 'ORD-' + y + mm + '-' + String(seq).padStart(3,'0');
      if (await Order.findOne({ orderNumber: orderNum })) continue;

      const day     = randInt(1, daysInMonth);
      const hour    = randInt(8, 22);
      const date    = new Date(y, m - 1, day, hour, randInt(0,59), randInt(0,59));
      const userRef = pick(userIds);
      const items   = randItems();
      const voucher = rand() < 0.3 ? pick(VOUCHER_CODES) : '';
      const payment = pick(PAYMENTS);
      const { status, payStatus } = statusForDate(date);

      await Order.create(makeOrder(orderNum, userRef.id, status, payStatus, voucher, items, userRef.address, userRef.phone, payment, date));
      added++;
    }
    totalMonthly += added;
    process.stdout.write('  ' + y + '-' + mm + ': +' + added + ' orders\n');
  }

  /* ── SUMMARY ── */
  const fu = await User.countDocuments();
  const fb = await Bowl.countDocuments();
  const fv = await Voucher.countDocuments();
  const fo = await Order.countDocuments();
  await mongoose.disconnect();

  console.log('');
  console.log('========================================');
  console.log('  SEED HOAN TAT');
  console.log('  Users    : ' + fu);
  console.log('  Bowls    : ' + fb);
  console.log('  Vouchers : ' + fv);
  console.log('  Orders   : ' + fo + '  (them moi: ' + (cOrders + totalMonthly) + ')');
  console.log('========================================');
  console.log('  admin   / admin123');
  console.log('  user    / user123');
  console.log('========================================');
  console.log('  cd backend && npm run dev  --> :3000');
  console.log('  cd EATOMO  && npm start    --> :4200\n');
}

seed().catch(err => { console.error('Seed that bai:', err.message || err); process.exit(1); });
