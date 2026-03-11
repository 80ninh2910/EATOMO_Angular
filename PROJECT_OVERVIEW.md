# EATOMO - Tổng Quan Dự Án & Yêu Cầu Backend

## 1. GIỚI THIỆU DỰ ÁN

**EATOMO** là website thương mại điện tử bán healthy food bowls (tô ăn lành mạnh).
- **Frontend**: Angular 19 (standalone components, signals, SSR-ready)
- **Backend**: NestJS + MySQL (TypeORM)
- **Đối tượng**: Đồ án môn E-Commerce, Khoa Hệ thống Thông tin, UEL

---

## 2. TỔNG QUAN FRONTEND

### 2.1 Các Trang Public (Không cần đăng nhập)

| Route | Component | Mô tả |
|-------|-----------|--------|
| `/` | HomeComponent | Trang chủ: hero video, giới thiệu, bowls showcase (6 bowls), reviews |
| `/our-bowls` | OurBowlsComponent | Danh sách 50 bowls, filter theo category, add to bag |
| `/build-your-own` | BuildYourOwnComponent | Tự build bowl: chọn protein → carbs → side → sauce, tính calories |
| `/about-us` | AboutUsComponent | Giới thiệu về EATOMO |
| `/stores` | StoresComponent | Danh sách cửa hàng |
| `/faqs` | FaqsComponent | Câu hỏi thường gặp |
| `/login` | LoginComponent | Đăng nhập (Admin + User) |
| `/register` | RegisterComponent | Đăng ký tài khoản |

### 2.2 Các Trang Yêu Cầu Đăng Nhập

| Route | Component | Mô tả |
|-------|-----------|--------|
| `/orders` | OrdersComponent | Giỏ hàng + Checkout (nhập thông tin giao hàng, đặt hàng) |

### 2.3 Trang Admin (Static HTML/iframe - Cần Guard adminGuard)

| Route | Trang | Mô tả |
|-------|-------|--------|
| `/admin` → Dashboard | dashboard.html | KPI cards, biểu đồ doanh thu, top products, giao dịch gần đây |
| `/admin` → Orders | orders.html | Quản lý đơn hàng: filter, xem, cập nhật trạng thái |
| `/admin` → Customers | customers.html | Quản lý khách hàng: thống kê, filter, xem chi tiết |
| `/admin` → Menu | menu.html | Quản lý menu: sửa giá, toggle stock, xóa bowl |
| `/admin` → Analytics | analytics.html | Phân tích: biểu đồ doanh thu, đơn hàng, khách hàng mới |

### 2.4 Services Frontend (Hiện tại dùng Mock Data)

#### AuthService (`auth.service.ts`)
- `login(credentials, isAdmin)` → Promise - Hiện mock, cần gọi `POST /api/auth/login`
- `register(data)` → Promise - Hiện mock, cần gọi `POST /api/auth/register`
- `logout()` - Xóa localStorage
- `isLoggedIn()` / `isAdmin()` / `getCurrentUser()`
- Dùng **Signal** để quản lý state, **localStorage** để persist

#### BowlService (`bowl.service.ts`)
- `getBowls()` → Observable<Bowl[]> - Hiện mock 50 bowls
- `getBowlsByCategory(category)` → Observable<Bowl[]>
- `getBowlById(id)` → Observable<Bowl>
- `updateBowlPrice(id, price)` - Admin
- `updateBowlStock(id, inStock)` - Admin

#### CartService (`cart.service.ts`)
- `addToCart(item)` / `removeFromCart(id)` / `updateQuantity(id, qty)` / `clearCart()`
- Computed signals: `totalItems`, `totalPrice`
- Persist trong **localStorage**

### 2.5 Models Frontend

#### Bowl Model
```typescript
interface Bowl {
  id: string;          // 'L1', 'B3', 'H5', 'V2'...
  name: string;
  description: string;
  price: number;       // VND (ví dụ: 149900)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: 'low-cal' | 'balanced' | 'high-protein' | 'vegetarian';
  image: string;
  inStock?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
```

#### User Model
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}
```

#### CartItem Model
```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  proteins?: string[];   // Cho custom bowl
  veggies?: string[];
  sauces?: string[];
}
```

---

## 3. DATABASE SCHEMA (MySQL)

### 3.1 Bảng `users`
| Cột | Kiểu | Mô tả |
|-----|------|--------|
| id | CHAR(36) PK | UUID |
| username | VARCHAR(50) UNIQUE | Tên đăng nhập |
| email | VARCHAR(255) UNIQUE | Email |
| password_hash | VARCHAR(255) | Bcrypt hash |
| full_name | VARCHAR(100) | Họ tên |
| phone | VARCHAR(20) | Số điện thoại |
| address | TEXT | Địa chỉ |
| role | ENUM('user','admin') | Vai trò |
| total_orders | INT | Tổng đơn hàng |
| total_spent | DECIMAL(12,2) | Tổng chi tiêu |
| is_active | TINYINT(1) | Trạng thái |
| created_at / updated_at | DATETIME | Timestamps |

### 3.2 Bảng `bowls`
| Cột | Kiểu | Mô tả |
|-----|------|--------|
| id | VARCHAR(10) PK | Mã bowl: L1, B3, H5... |
| name | VARCHAR(100) | Tên bowl |
| description | TEXT | Mô tả thành phần |
| price | DECIMAL(10,2) | Giá VND |
| calories / protein / carbs / fat | INT | Thông tin dinh dưỡng |
| category | ENUM('low-cal','balanced','high-protein','vegetarian') | Phân loại |
| image_url | VARCHAR(500) | Đường dẫn ảnh |
| in_stock | TINYINT(1) | Còn hàng không |
| is_featured | TINYINT(1) | Nổi bật |
| created_at / updated_at | DATETIME | Timestamps |

### 3.3 Bảng `orders`
| Cột | Kiểu | Mô tả |
|-----|------|--------|
| id | CHAR(36) PK | UUID |
| user_id | CHAR(36) FK | Người đặt |
| order_number | VARCHAR(20) UNIQUE | Mã đơn |
| status | ENUM('pending','confirmed','preparing','delivering','completed','cancelled') | Trạng thái |
| subtotal / tax / shipping_fee / discount_amount / total_amount | DECIMAL(10,2) | Giá |
| payment_method | ENUM('cash','momo','card','bank_transfer') | Phương thức |
| payment_status | ENUM('unpaid','paid','refunded') | Trạng thái TT |
| delivery_address / delivery_phone / delivery_notes | TEXT | Giao hàng |
| voucher_id | CHAR(36) FK | Mã giảm giá |
| created_at / updated_at / completed_at | DATETIME | Timestamps |

### 3.4 Bảng `order_items`
| Cột | Kiểu | Mô tả |
|-----|------|--------|
| id | CHAR(36) PK | UUID |
| order_id | CHAR(36) FK | Đơn hàng |
| bowl_id | VARCHAR(10) FK | Bowl |
| bowl_name | VARCHAR(100) | Tên snapshot |
| unit_price | DECIMAL(10,2) | Giá snapshot |
| quantity | INT | Số lượng |
| subtotal | DECIMAL(10,2) | Tổng |
| custom_proteins / custom_veggies / custom_sauces | JSON | Tùy chỉnh |

### 3.5 Bảng `vouchers`
- code, discount_type, discount_value, max_uses, valid_from/until, is_active, target_churn_level

### 3.6 Bảng `user_vouchers`
- user_id, voucher_id, is_used, used_at, order_id, expires_at

### 3.7 Bảng `admin_actions` (Audit log)
- admin_id, action_type, target_type, target_id, old_value, new_value

---

## 4. YÊU CẦU API BACKEND

### 4.1 Authentication (`/api/auth`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/api/auth/register` | Đăng ký tài khoản | Public |
| POST | `/api/auth/login` | Đăng nhập (trả JWT) | Public |
| GET | `/api/auth/profile` | Lấy thông tin user hiện tại | JWT |

**Register Body**: `{ username, email, password }`
**Login Body**: `{ username, password }`
**Response**: `{ access_token, user: { id, username, email, role } }`

### 4.2 Bowls (`/api/bowls`) — Public + Admin CRUD

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/bowls` | Lấy tất cả bowls | Public |
| GET | `/api/bowls?category=low-cal` | Filter theo category | Public |
| GET | `/api/bowls/:id` | Lấy bowl theo ID | Public |
| POST | `/api/bowls` | Tạo bowl mới | Admin |
| PATCH | `/api/bowls/:id` | Cập nhật bowl (giá, stock...) | Admin |
| DELETE | `/api/bowls/:id` | Xóa bowl | Admin |

### 4.3 Orders (`/api/orders`) — User + Admin

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/api/orders` | Tạo đơn hàng mới | JWT (User) |
| GET | `/api/orders` | Lấy đơn hàng của user hiện tại | JWT (User) |
| GET | `/api/orders/:id` | Xem chi tiết đơn hàng | JWT |
| GET | `/api/admin/orders` | Lấy tất cả đơn hàng | Admin |
| PATCH | `/api/admin/orders/:id/status` | Cập nhật trạng thái đơn | Admin |

**Create Order Body**:
```json
{
  "items": [
    { "bowlId": "L1", "quantity": 2 },
    { "bowlId": "B3", "quantity": 1 }
  ],
  "deliveryAddress": "123 ABC Street",
  "deliveryPhone": "0901234567",
  "deliveryNotes": "Ring doorbell",
  "paymentMethod": "cash",
  "voucherCode": "SAVE10"
}
```

### 4.4 Admin — Customers (`/api/admin/customers`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/admin/customers` | Lấy danh sách khách hàng | Admin |
| GET | `/api/admin/customers/:id` | Chi tiết khách hàng | Admin |
| PATCH | `/api/admin/customers/:id` | Cập nhật thông tin KH | Admin |

### 4.5 Admin — Dashboard (`/api/admin/dashboard`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/admin/dashboard/stats` | KPI: tổng doanh thu, đơn hàng, khách hàng | Admin |
| GET | `/api/admin/dashboard/top-products` | Top sản phẩm bán chạy | Admin |
| GET | `/api/admin/dashboard/recent-orders` | Đơn hàng gần đây | Admin |

### 4.6 Vouchers (`/api/vouchers`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/api/vouchers` | Tạo voucher | Admin |
| GET | `/api/vouchers` | Lấy tất cả vouchers | Admin |
| POST | `/api/vouchers/validate` | Kiểm tra mã giảm giá | JWT (User) |

---

## 5. BUSINESS LOGIC

### 5.1 Tính Giá Đơn Hàng
```
subtotal = SUM(bowl.price * quantity)  // Không bao gồm thuế
tax = subtotal * 0.08                  // 8% VAT
shipping_fee = subtotal > 500000 ? 0 : 30000  // Miễn ship trên 500k
discount = voucher áp dụng (nếu có)
total = subtotal + tax + shipping_fee - discount
```

### 5.2 Custom Bowl (Build Your Own)
- Base price: 89,000 VND
- User chọn: 1 protein + 1 carbs + 1 side + 1 sauce
- Lưu trong order_items với `custom_proteins`, `custom_veggies`, `custom_sauces` dạng JSON

### 5.3 Trạng Thái Đơn Hàng
```
pending → confirmed → preparing → delivering → completed
                                              → cancelled (bất kỳ lúc nào trước completed)
```

### 5.4 Phương Thức Thanh Toán
- Cash on Delivery (COD)
- Credit Card
- Bank Transfer
- MoMo (ví điện tử)

---

## 6. DỮ LIỆU SEED (50 Bowls)

### Low Calories (L1-L10): 10 bowls, 274-439 kcal, giá 139,900 - 179,900 VND
### Balanced (B1-B15): 15 bowls, 434-586 kcal, giá 164,900 - 219,900 VND
### High Protein (H1-H10): 10 bowls, 560-720 kcal, giá 219,900 - 269,900 VND
### Vegetarian (V1-V5): 5 bowls, 377-536 kcal, giá 129,900 - 149,900 VND

---

## 7. TECH STACK

### Frontend
- Angular 19 (standalone, signals, @if/@for syntax)
- TypeScript
- RxJS
- SSR ready (Angular Universal)

### Backend (Cần tạo mới)
- NestJS 10
- TypeORM + MySQL
- JWT Authentication (passport-jwt)
- bcrypt password hashing
- class-validator / class-transformer
- CORS enabled

### Database
- MySQL 8.0+
- Database name: `eatomo_db`
- Character set: utf8mb4

---

## 8. FRONTEND ↔ BACKEND INTEGRATION PLAN

### Bước 1: Cập nhật AuthService
```typescript
// Thay mock login bằng:
this.http.post<AuthResponse>('http://localhost:3000/api/auth/login', credentials)

// Thay mock register bằng:
this.http.post<AuthResponse>('http://localhost:3000/api/auth/register', data)
```

### Bước 2: Cập nhật BowlService
```typescript
// Thay mock data bằng:
this.http.get<Bowl[]>('http://localhost:3000/api/bowls')
this.http.get<Bowl[]>('http://localhost:3000/api/bowls?category=' + category)
```

### Bước 3: Tạo OrderService mới
```typescript
// POST order tới backend:
this.http.post<Order>('http://localhost:3000/api/orders', orderData, { headers })
```

### Bước 4: Thêm HTTP Interceptor cho JWT
```typescript
// Tự động gắn Authorization header cho mọi request
headers: { Authorization: `Bearer ${token}` }
```
