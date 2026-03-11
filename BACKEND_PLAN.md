# 📋 KẾ HOẠCH TẠO BACKEND MỚI - EATOMO

## 🎯 Mục tiêu
Tạo backend Express.js thuần (KHÔNG dùng NestJS) để:
- Đơn giản, dễ debug, ít lỗi cấu hình
- Phù hợp mức đồ án E-Commerce UEL
- Kết nối MySQL, seed data 50 bowls
- JWT Authentication
- CORS cho Angular frontend

---

## 📁 Cấu trúc thư mục

```
backend/
├── package.json
├── .env                     # Cấu hình DB, JWT secret
├── server.js                # Entry point - khởi động server
├── config/
│   └── database.js          # Kết nối MySQL (mysql2 pool)
├── middleware/
│   ├── auth.js              # JWT verify middleware
│   └── admin.js             # Admin role check middleware
├── routes/
│   ├── auth.routes.js       # POST /register, /login, GET /profile
│   ├── bowl.routes.js       # CRUD bowls
│   ├── order.routes.js      # User orders
│   └── admin.routes.js      # Admin: orders, customers, dashboard, bowls CRUD
├── controllers/
│   ├── auth.controller.js   # Logic xử lý auth
│   ├── bowl.controller.js   # Logic xử lý bowls
│   ├── order.controller.js  # Logic xử lý orders
│   └── admin.controller.js  # Logic xử lý admin
├── seed/
│   └── seed.js              # Tạo bảng + seed 50 bowls + admin user
└── test-connection.js       # Script test DB connection riêng
```

---

## 🔧 Tech Stack

| Package | Mục đích | Lý do chọn |
|---------|----------|------------|
| `express` | Web framework | Đơn giản nhất, ít config |
| `mysql2` | MySQL driver | Hỗ trợ Promise, pool connection |
| `bcryptjs` | Hash password | Nhẹ hơn bcrypt (không cần native build) |
| `jsonwebtoken` | JWT auth | Standard cho REST API |
| `cors` | CORS | Cho phép Angular gọi API |
| `dotenv` | Env variables | Quản lý config |
| `uuid` | Generate UUID | Cho user/order IDs |

**KHÔNG dùng**: TypeORM, TypeScript, NestJS, class-validator → giảm 90% lỗi cấu hình

---

## 🗄️ Database Tables (Giữ nguyên SQL hiện có)

Sử dụng file `create_database_mysql.sql` đã có, bao gồm:
1. **users** - Người dùng (admin + user)
2. **bowls** - 50 bowls (seed sẵn)
3. **orders** - Đơn hàng
4. **order_items** - Chi tiết đơn hàng
5. **vouchers** - Mã giảm giá
6. **user_vouchers** - Voucher đã gán cho user
7. **admin_actions** - Log hành động admin

---

## 🔌 API Endpoints

### 1. Auth (`/api/auth`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/api/auth/register` | Đăng ký | Public |
| POST | `/api/auth/login` | Đăng nhập → JWT | Public |
| GET | `/api/auth/profile` | Thông tin user | JWT |

### 2. Bowls (`/api/bowls`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/bowls` | Tất cả bowls (?category=low-cal) | Public |
| GET | `/api/bowls/:id` | Bowl theo ID | Public |

### 3. Orders (`/api/orders`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/api/orders` | Tạo đơn hàng | JWT User |
| GET | `/api/orders` | Đơn hàng của user | JWT User |
| GET | `/api/orders/:id` | Chi tiết đơn hàng | JWT User |

### 4. Admin (`/api/admin`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/admin/dashboard/stats` | KPI overview | Admin |
| GET | `/api/admin/dashboard/top-products` | Top bowls bán chạy | Admin |
| GET | `/api/admin/dashboard/recent-orders` | Đơn gần đây | Admin |
| GET | `/api/admin/orders` | Tất cả đơn hàng | Admin |
| PATCH | `/api/admin/orders/:id/status` | Cập nhật trạng thái | Admin |
| GET | `/api/admin/customers` | Danh sách KH | Admin |
| GET | `/api/admin/customers/:id` | Chi tiết KH | Admin |
| POST | `/api/admin/bowls` | Tạo bowl mới | Admin |
| PATCH | `/api/admin/bowls/:id` | Sửa bowl | Admin |
| DELETE | `/api/admin/bowls/:id` | Xóa bowl | Admin |

---

## 🔐 Authentication Flow

```
1. User POST /api/auth/login { username, password }
2. Server verify password (bcrypt.compare)
3. Server trả về { access_token: JWT, user: { id, username, email, role } }
4. Frontend lưu token vào localStorage
5. Mỗi request sau gửi header: Authorization: Bearer <token>
6. Middleware auth.js verify token → req.user = { id, username, role }
7. Middleware admin.js check req.user.role === 'admin'
```

---

## 💰 Business Logic

### Tính giá đơn hàng:
```
subtotal = SUM(bowl.price * quantity)
tax = subtotal * 0.08 (8% VAT)  
shipping = subtotal > 500000 ? 0 : 30000
total = subtotal + tax + shipping - discount
```

### Trạng thái đơn hàng:
```
pending → confirmed → preparing → delivering → completed
                                              → cancelled
```

---

## 🧪 Chiến lược phát hiện lỗi

### File `test-connection.js` - Chạy độc lập test DB:
```
node test-connection.js
→ ✅ MySQL connected successfully
→ ✅ Database eatomo_db exists  
→ ✅ Tables: users(1), bowls(50), orders(0)
→ ✅ Admin user exists
```

### File `seed.js` - Tạo bảng + seed data:
```
node seed/seed.js
→ Tạo tất cả tables (DROP IF EXISTS + CREATE)
→ Seed admin user (bcrypt hash)
→ Seed 50 bowls
→ Log chi tiết từng bước
```

### Server startup checks:
```
1. Kiểm tra .env tồn tại
2. Kiểm tra DB connection trước khi listen
3. Log rõ ràng: PORT, DB_HOST, DB_NAME
4. Bắt tất cả unhandled errors
```

### Mỗi API endpoint:
```
- try/catch toàn bộ
- Log request: method, url, body
- Return error rõ ràng: { success: false, message: "...", error: "..." }
- HTTP status code chính xác (400, 401, 403, 404, 500)
```

---

## 🚀 Thứ tự thực hiện

| Bước | File | Mô tả |
|------|------|--------|
| 1 | `package.json` | Dependencies |
| 2 | `.env` | Config DB + JWT |
| 3 | `config/database.js` | MySQL pool connection |
| 4 | `test-connection.js` | Test DB trước khi code tiếp |
| 5 | `seed/seed.js` | Tạo bảng + seed data |
| 6 | `middleware/auth.js` | JWT middleware |
| 7 | `middleware/admin.js` | Admin check |
| 8 | `controllers/auth.controller.js` | Auth logic |
| 9 | `routes/auth.routes.js` | Auth routes |
| 10 | `controllers/bowl.controller.js` | Bowl logic |
| 11 | `routes/bowl.routes.js` | Bowl routes |
| 12 | `controllers/order.controller.js` | Order logic |
| 13 | `routes/order.routes.js` | Order routes |
| 14 | `controllers/admin.controller.js` | Admin logic |
| 15 | `routes/admin.routes.js` | Admin routes |
| 16 | `server.js` | Entry point |
| 17 | **TEST** | Chạy từng bước, test từng API |

---

## ⚙️ Cấu hình .env
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=eatomo_db
JWT_SECRET=eatomo_secret_key_2024
JWT_EXPIRES_IN=7d
PORT=3000
```

---

## 📊 Khác biệt với backend cũ (NestJS)

| Tiêu chí | NestJS cũ | Express mới |
|-----------|-----------|-------------|
| Files | ~40+ files | ~15 files |
| Config | tsconfig, nest-cli, module, decorator | 0 config files |
| Language | TypeScript | JavaScript thuần |
| ORM | TypeORM (entity, migration) | mysql2 raw SQL |
| Build | `npm run build` → dist/ | Chạy trực tiếp `node server.js` |
| Debug | Khó (decorator, DI, module) | Dễ (console.log, try/catch) |
| Startup | ~5-10s compile | ~1s |
| Error trace | Stack trace qua decorator | Stack trace trực tiếp |

---

## ✅ Checklist trước khi bắt đầu

- [ ] MySQL đã cài và chạy trên localhost:3306
- [ ] Biết password MySQL root
- [ ] Node.js >= 18 đã cài
- [ ] Angular frontend đang chạy trên port 4200

**Sẵn sàng? Báo "bắt đầu" để tôi tạo backend mới theo kế hoạch này.**
