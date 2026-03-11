# 📋 SERVICE PLAN - EATOMO Angular Frontend

> Ngày tạo: 05/03/2026  
> Mục tiêu: Phân tích, thiết kế và triển khai toàn bộ service layer cho Angular frontend  
> Backend: Express.js + MongoDB (API base: `http://localhost:3000/api`)

---

## 1. TỔNG QUAN NGHIỆP VỤ

| # | Nghiệp vụ | Service | Trạng thái |
|---|-----------|---------|-----------|
| 1 | Bowl từ MongoDB → UI (public + admin CRUD) | `BowlService` | REFACTOR |
| 2 | Login/Logout user & admin (2 UI routing khác nhau) | `AuthService` | REFACTOR |
| 3 | Tự động gắn JWT token vào HTTP requests | `AuthInterceptor` | TẠO MỚI |
| 4 | Cart management (thống nhất toàn app) | `CartService` | FIX ADOPTION |
| 5 | Ghi nhận order + xem order history | `OrderService` | TẠO MỚI |
| 6 | Admin: dashboard doanh thu, thống kê | `DashboardService` | TẠO MỚI |
| 7 | Admin: phát hành promotion với điều kiện | `PromotionService` | TẠO MỚI |

---

## 2. PHÂN TÍCH SERVICE HIỆN TẠI

### 2.1 AuthService (`services/auth.service.ts`) — ❌ KHÔNG HOẠT ĐỘNG

**Vấn đề:**
- Mock login bằng `setTimeout` + `Promise`, không gọi HTTP nào
- Không quản lý JWT token (không lưu `access_token`, không gửi `Authorization` header)
- `LoginComponent` **BYPASS hoàn toàn** AuthService — hardcode `user/user123`, `admin/admin123` rồi navigate trực tiếp
  → Signal `currentUser` luôn = `null` sau login
- `authGuard` / `adminGuard` khai báo sẵn nhưng **KHÔNG áp dụng** cho route nào trong `app.routes.ts`
- `HeaderComponent` không tích hợp AuthService → không hiển thị trạng thái đăng nhập
- Không có `AuthInterceptor`

**Giải pháp:** Refactor toàn bộ → HTTP calls + JWT management

### 2.2 BowlService (`services/bowl.service.ts`) — ⚠️ MOCK DATA

**Vấn đề:**
- 50 bowls **hardcode** trong array TypeScript, không gọi API
- Không inject `HttpClient`
- `updateBowlPrice()`, `updateBowlStock()` có nhưng **không ai gọi**
- Thiếu `createBowl()`, `deleteBowl()`, `updateBowl()` cho admin

**Giải pháp:** Refactor → HTTP GET public + HTTP CRUD admin

### 2.3 CartService (`services/cart.service.ts`) — ✅ THIẾT KẾ TỐT, ❌ BỊ BỎ QUA

**Thiết kế tốt:** Signals, computed `totalItems`/`totalPrice`, localStorage persist, SSR-safe

**Vấn đề:**
| Component | Dùng CartService? | Chi tiết |
|-----------|-------------------|----------|
| `BuildYourOwnComponent` | ✅ Có | `cartService.addToCart()` |
| `OurBowlsComponent` | ❌ Không | Tự có `cartItems[]`, `loadCart()`, `saveCart()` riêng |
| `OrdersComponent` | ❌ Không | Đọc `localStorage` trực tiếp, tự tính subtotal/tax |

**Giải pháp:** Fix adoption — OurBowls + Orders dùng CartService

### 2.4 OrderService — ❌ CHƯA TỒN TẠI

- `OrdersComponent.checkout()` chỉ = `alert('Order placed!')`
- `OrderAdminComponent` chứa 18 orders hardcode trong component
- Không có service nào quản lý order

### 2.5 DashboardService — ❌ CHƯA TỒN TẠI

- `ReportAdminComponent` hiện **rỗng hoàn toàn** (chỉ có template)

### 2.6 PromotionService — ❌ CHƯA TỒN TẠI

- `PromotionAdminComponent` hiện **rỗng hoàn toàn** (chỉ có template)

---

## 3. KIẾN TRÚC SERVICE MỚI

### 3.1 Models (`src/app/models/`)

```
models/
├── bowl.model.ts          ← GIỮ NGUYÊN (xóa duplicate CartItem)
├── user.model.ts          ← MỚI (tách từ auth.service.ts)
├── order.model.ts         ← MỚI
├── promotion.model.ts     ← MỚI
└── dashboard.model.ts     ← MỚI
```

#### user.model.ts
```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'user';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
```

#### order.model.ts
```typescript
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'momo' | 'card' | 'bank_transfer';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface OrderItem {
  bowlId: string;
  bowlName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  customProteins?: string[];
  customVeggies?: string[];
  customSauces?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryNotes?: string;
  voucherCode?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CreateOrderRequest {
  items: { bowlId: string; quantity: number; customProteins?: string[]; customVeggies?: string[]; customSauces?: string[] }[];
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  voucherCode?: string;
}
```

#### promotion.model.ts
```typescript
export type DiscountType = 'percentage' | 'fixed';
export type PromotionTarget = 'all' | 'new_customer' | 'vip' | 'specific_category';

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  maxUses: number;
  currentUses: number;
  target: PromotionTarget;
  targetCategory?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromotionRequest {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  target: PromotionTarget;
  targetCategory?: string;
}

export interface VoucherValidation {
  valid: boolean;
  discountType?: DiscountType;
  discountValue?: number;
  maxDiscountAmount?: number;
  message: string;
}
```

#### dashboard.model.ts
```typescript
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  revenueGrowth: number;   // % so với kỳ trước
  orderGrowth: number;
  customerGrowth: number;
}

export interface RevenueDataPoint {
  label: string;       // ngày hoặc tuần hoặc tháng
  revenue: number;
  orders: number;
}

export interface TopProduct {
  bowlId: string;
  bowlName: string;
  image: string;
  totalSold: number;
  totalRevenue: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
}
```

### 3.2 Services (`src/app/services/`)

```
services/
├── auth.service.ts        ← REFACTOR (HTTP + JWT + signal)
├── auth.interceptor.ts    ← MỚI (auto Bearer token + 401 handling)
├── bowl.service.ts        ← REFACTOR (HTTP + admin CRUD)
├── cart.service.ts        ← GIỮ NGUYÊN
├── order.service.ts       ← MỚI
├── dashboard.service.ts   ← MỚI
└── promotion.service.ts   ← MỚI
```

### 3.3 API Mapping

#### AuthService
| Method | Endpoint | Auth |
|--------|----------|------|
| `login(credentials)` | `POST /api/auth/login` | Public |
| `register(data)` | `POST /api/auth/register` | Public |
| `getProfile()` | `GET /api/auth/profile` | JWT |
| `logout()` | Client-side only | - |

#### BowlService
| Method | Endpoint | Auth |
|--------|----------|------|
| `getBowls(category?)` | `GET /api/bowls?category=` | Public |
| `getBowlById(id)` | `GET /api/bowls/:id` | Public |
| `createBowl(data)` | `POST /api/admin/bowls` | Admin |
| `updateBowl(id, data)` | `PATCH /api/admin/bowls/:id` | Admin |
| `deleteBowl(id)` | `DELETE /api/admin/bowls/:id` | Admin |

#### OrderService
| Method | Endpoint | Auth |
|--------|----------|------|
| `createOrder(data)` | `POST /api/orders` | JWT User |
| `getMyOrders()` | `GET /api/orders` | JWT User |
| `getOrderById(id)` | `GET /api/orders/:id` | JWT |
| `cancelOrder(id)` | `PATCH /api/orders/:id/cancel` | JWT User |
| `getAllOrders(filters?)` | `GET /api/admin/orders` | Admin |
| `updateOrderStatus(id, status)` | `PATCH /api/admin/orders/:id/status` | Admin |

#### DashboardService
| Method | Endpoint | Auth |
|--------|----------|------|
| `getStats()` | `GET /api/admin/dashboard/stats` | Admin |
| `getRevenueChart(period)` | `GET /api/admin/dashboard/revenue?period=` | Admin |
| `getTopProducts(limit)` | `GET /api/admin/dashboard/top-products?limit=` | Admin |
| `getRecentOrders(limit)` | `GET /api/admin/dashboard/recent-orders?limit=` | Admin |

#### PromotionService
| Method | Endpoint | Auth |
|--------|----------|------|
| `getPromotions()` | `GET /api/admin/promotions` | Admin |
| `createPromotion(data)` | `POST /api/admin/promotions` | Admin |
| `updatePromotion(id, data)` | `PATCH /api/admin/promotions/:id` | Admin |
| `deletePromotion(id)` | `DELETE /api/admin/promotions/:id` | Admin |
| `toggleActive(id)` | `PATCH /api/admin/promotions/:id/toggle` | Admin |
| `validateVoucher(code)` | `POST /api/vouchers/validate` | JWT User |

---

## 4. CẦN SỬA Ở COMPONENT

### 4.1 LoginComponent — Phải gọi AuthService
```
- Xóa hardcode user/user123, admin/admin123
- Gọi authService.login() → nhận JWT + user
- Admin → navigate /admin
- User → navigate / hoặc redirectUrl
```

### 4.2 OurBowlsComponent — Dùng CartService
```
- Xóa cartItems[], loadCart(), saveCart(), totalItems, totalPrice
- Inject CartService
- addToBag() → cartService.addToCart()
- Template dùng cartService.cartItems(), cartService.totalItems()
```

### 4.3 OrdersComponent — Dùng CartService + OrderService
```
- Xóa cart[], loadCart(), removeFromCart(), updateQuantity()
- Inject CartService + OrderService
- checkout() → orderService.createOrder() → cartService.clearCart()
- Dùng cartService signals cho subtotal, tax, total
```

### 4.4 HeaderComponent — Tích hợp AuthService
```
- Inject AuthService
- Hiển thị username khi logged in
- Hiển thị nút Login/Logout
- Hiển thị cart badge từ CartService
```

### 4.5 app.routes.ts — Áp dụng Guards
```
- /orders → canActivate: [authGuard]
- /admin/** → canActivate: [adminGuard]
- Xóa các static page routes thừa
```

### 4.6 app.config.ts — Đăng ký Interceptor
```
- provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
```

---

## 5. THỨ TỰ THỰC HIỆN

| Bước | Task | Files |
|------|------|-------|
| 1 | Tạo models mới | `user.model.ts`, `order.model.ts`, `promotion.model.ts`, `dashboard.model.ts` |
| 2 | Refactor AuthService | `auth.service.ts` |
| 3 | Tạo AuthInterceptor | `auth.interceptor.ts` |
| 4 | Update app.config.ts | `app.config.ts` |
| 5 | Refactor BowlService | `bowl.service.ts` |
| 6 | Tạo OrderService | `order.service.ts` |
| 7 | Tạo DashboardService | `dashboard.service.ts` |
| 8 | Tạo PromotionService | `promotion.service.ts` |
| 9 | Fix LoginComponent | `login.component.ts` |
| 10 | Fix OurBowlsComponent | `our-bowls.component.ts` |
| 11 | Fix OrdersComponent | `orders.component.ts` |
| 12 | Fix HeaderComponent | `header.component.ts` |
| 13 | Fix app.routes.ts | `app.routes.ts` |
| 14 | Fix bowl.model.ts | Xóa duplicate CartItem |

---

## 6. TRẠNG THÁI THỰC HIỆN

| # | Task | Status |
|---|------|--------|
| 1 | Tạo models | ✅ Xong |
| 2 | Refactor AuthService | ✅ Xong |
| 3 | Tạo AuthInterceptor | ✅ Xong |
| 4 | Update app.config.ts | ✅ Xong |
| 5 | Refactor BowlService | ✅ Xong |
| 6 | Tạo OrderService | ✅ Xong |
| 7 | Tạo DashboardService | ✅ Xong |
| 8 | Tạo PromotionService | ✅ Xong |
| 9 | Fix LoginComponent | ✅ Xong |
| 10 | Fix OurBowlsComponent | ✅ Xong |
| 11 | Fix OrdersComponent | ✅ Xong |
| 12 | Fix HeaderComponent | ✅ Xong |
| 13 | Fix app.routes.ts | ✅ Xong |
| 14 | Fix bowl.model.ts | ✅ Xong |
| 15 | Build verification | ✅ Xong — `ng build` pass (0 TS errors) |
