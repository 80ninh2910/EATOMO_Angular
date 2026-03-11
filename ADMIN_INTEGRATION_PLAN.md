# Kế hoạch hoàn thiện Admin Panel — EATOMO

> Ngày tạo: 12/03/2026  
> Mục tiêu: Kết nối toàn bộ admin UI với backend API, loại bỏ dữ liệu hardcode

---

## 1. Phân tích hiện trạng

### 1.1 Backend — API đã sẵn sàng

| Module | Endpoint | Method | Controller |
|--------|----------|--------|------------|
| Dashboard | `/api/admin/dashboard/stats` | GET | `getDashboardStats` |
| Dashboard | `/api/admin/dashboard/revenue` | GET | `getRevenueChart` |
| Dashboard | `/api/admin/dashboard/top-products` | GET | `getTopProducts` |
| Dashboard | `/api/admin/dashboard/recent-orders` | GET | `getRecentOrders` |
| Orders | `/api/admin/orders` | GET | `getAllOrders` |
| Orders | `/api/admin/orders/:id/status` | PATCH | `updateOrderStatus` |
| Bowls | `/api/admin/bowls` | POST | `createBowl` |
| Bowls | `/api/admin/bowls/:id` | PATCH | `updateBowl` |
| Bowls | `/api/admin/bowls/:id` | DELETE | `deleteBowl` |
| Bowls | `/api/bowls` | GET | `getBowls` (public) |
| Customers | `/api/admin/customers` | GET | `getCustomers` |
| Customers | `/api/admin/customers/:id` | GET | `getCustomerById` |
| Promotions | `/api/promotions` | GET | `getPromotions` |
| Promotions | `/api/promotions` | POST | `createPromotion` |
| Promotions | `/api/promotions/:id` | PATCH | `updatePromotion` |
| Promotions | `/api/promotions/:id` | DELETE | `deletePromotion` |
| Promotions | `/api/promotions/:id/toggle` | PATCH | `togglePromotion` |

### 1.2 Angular Services — Trạng thái

| Service | Trạng thái | Ghi chú |
|---------|-----------|---------|
| `BowlService` | ✅ Đầy đủ | `getBowls`, `createBowl`, `updateBowl`, `deleteBowl` |
| `OrderService` | ✅ Đầy đủ | `getAllOrders`, `updateOrderStatus` |
| `DashboardService` | ✅ Đầy đủ | Tất cả 4 endpoints |
| `PromotionService` | ⚠️ Sai URL | Dùng `/api/admin/promotions` thay vì `/api/promotions` |
| `CustomerService` | ❌ Chưa tồn tại | Cần tạo mới |

### 1.3 Admin Components — Trạng thái

| Component | Đọc từ API | Tạo/Sửa/Xóa qua API | Ghi chú |
|-----------|-----------|---------------------|---------|
| `product-admin` | ✅ Dùng BowlService | ❌ Chưa có logic | Chỉ load danh sách thật |
| `order-admin` | ❌ Hardcoded | ❌ Hardcoded | Toàn bộ là dữ liệu giả |
| `customer-admin` | ❌ Hardcoded | ❌ N/A (view only) | Toàn bộ là dữ liệu giả |
| `promotion-admin` | ❌ Shell rỗng | ❌ Shell rỗng | Chưa có gì |
| `report-admin` | ❌ Shell rỗng | ❌ N/A | Cần tích hợp DashboardService |

---

## 2. Kế hoạch thực hiện (Ưu tiên cao → thấp)

### TASK 1 — Sửa PromotionService URL ⚠️ (5 phút)

**File:** `EATOMO/src/app/services/promotion.service.ts`

**Vấn đề:** Service gọi `/api/admin/promotions` nhưng backend route là `/api/promotions`

```
Sửa tất cả URL trong PromotionService:
  /api/admin/promotions  →  /api/promotions
```

---

### TASK 2 — Tạo CustomerService ❌ (15 phút)

**Tạo file:** `EATOMO/src/app/services/customer.service.ts`

```typescript
// Cần các method:
getCustomers(): Observable<Customer[]>            // GET /api/admin/customers
getCustomerById(id: string): Observable<Customer> // GET /api/admin/customers/:id
```

**Tạo model:** `EATOMO/src/app/models/customer.model.ts`

```typescript
export interface Customer {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  role: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  orders?: Order[];
}
```

---

### TASK 3 — Kết nối Order Admin với Backend ❌ (60-90 phút)

**File:** `EATOMO/src/app/admin/order/order-admin.component.ts`

**Thay đổi cần làm:**
1. Inject `OrderService` vào component
2. Xóa toàn bộ `orderMeta` hardcoded (readonly object ~400 dòng)
3. Gọi `orderService.getAllOrders()` trong `ngOnInit()`
4. Map `Order` model từ backend sang local interface `OrderRow`
5. Kết nối nút **"Cập nhật trạng thái"** → gọi `orderService.updateOrderStatus(id, status)`
6. Thêm loading state / error handling
7. Thêm filter theo status gọi API với query params

**Model mapping cần thiết:**
```
Backend Order.status:  pending | confirmed | preparing | delivering | completed | cancelled
Front tab labels:      pending | shipping | delivered | cancelled
```

---

### TASK 4 — Kết nối Customer Admin với Backend ❌ (60 phút)

**File:** `EATOMO/src/app/admin/customer/customer-admin.component.ts`

**Thay đổi cần làm:**
1. Inject `CustomerService`
2. Xóa toàn bộ mảng `customers` hardcoded (~300 dòng)
3. Gọi `customerService.getCustomers()` trong `ngOnInit()`
4. Map dữ liệu từ API (đơn giản hơn mock: không có rfm score, clv, churnRisk)
5. Khi click xem chi tiết, gọi `customerService.getCustomerById(id)` để lấy danh sách đơn hàng

**Lưu ý:** Backend chưa hỗ trợ các trường nâng cao như RFM score, CLV, Health Score, Churn Risk.  
→ Có thể tính toán đơn giản phía frontend từ `totalOrders` + `totalSpent`, hoặc ẩn các trường này nếu không cần thiết cho demo.

---

### TASK 5 — Hoàn thiện Product Admin CRUD ❌ (60 phút)

**File:** `EATOMO/src/app/admin/product/product-admin.component.ts`

**Hiện tại:** Đã đọc danh sách từ BowlService ✅  
**Cần thêm:**

1. **Thêm sản phẩm mới:**
   - Tạo form modal (hoặc slide panel)
   - Fields: name, description, price, calories, protein, carbs, fat, category, image, inStock, isFeatured
   - Gọi `bowlService.createBowl(data)`

2. **Sửa sản phẩm:**
   - Mở detail panel đã có, thêm "Edit mode"
   - Gọi `bowlService.updateBowl(id, data)`

3. **Xóa sản phẩm:**
   - Confirm dialog → gọi `bowlService.deleteBowl(id)`
   - Xóa item khỏi local `products[]`

4. **Toggle inStock:**
   - Click button → gọi `bowlService.updateBowlStock(id, !current)`

**Lưu ý ChangeDetectionStrategy.OnPush:** Phải dùng `ChangeDetectorRef.markForCheck()` hoặc inject `ChangeDetectorRef` khi cập nhật dữ liệu bất đồng bộ.

---

### TASK 6 — Hoàn thiện Promotion Admin ❌ (90 phút)

**File:** `EATOMO/src/app/admin/promotion/promotion-admin.component.ts`

**Component hiện tại là shell rỗng** — cần implement toàn bộ.

**Chức năng cần implement:**

1. **Hiển thị danh sách promotions:**
   - Load từ `promotionService.getPromotions()`
   - Hiển thị: code, description, discount type/value, validity, uses, status

2. **Tạo promotion mới:**
   - Form: code, description, discountType (percentage/fixed), discountValue, minOrderValue, maxDiscountAmount, validFrom, validUntil, maxUses
   - Gọi `promotionService.createPromotion(data)`

3. **Sửa promotion:**
   - Gọi `promotionService.updatePromotion(id, data)`

4. **Xóa promotion:**
   - Gọi `promotionService.deletePromotion(id)`

5. **Bật/tắt promotion:**
   - Gọi `promotionService.toggleActive(id)`

**Lưu ý:** Sau TASK 1 sửa URL, service sẽ hoạt động đúng.

---

### TASK 7 — Hoàn thiện Report Admin ❌ (60 phút)

**File:** `EATOMO/src/app/admin/report/report-admin.component.ts`

**Component hiện tại là shell rỗng** — cần implement.

**Dữ liệu từ DashboardService (đã sẵn sàng):**
1. `getStats()` → KPI cards: tổng doanh thu, đơn hàng, khách hàng, giá trị trung bình
2. `getRevenueChart(period)` → Biểu đồ doanh thu theo tuần/tháng/năm
3. `getTopProducts()` → Bảng/chart sản phẩm bán chạy nhất
4. `getRecentOrders()` → Bảng đơn hàng gần đây

**Cần làm:**
1. Inject `DashboardService`
2. Load tất cả 4 dataset trong `ngOnInit()`
3. Render KPI cards
4. Render bảng top products
5. Render bảng recent orders
6. Biểu đồ doanh thu: cần thêm thư viện chart (Chart.js hoặc ngx-charts) hoặc dùng SVG path đơn giản

---

## 3. Vấn đề kỹ thuật cần xử lý

### 3.1 ChangeDetectionStrategy.OnPush
Tất cả admin components đang dùng `OnPush`. Khi có async data:
```typescript
// Cách 1: inject ChangeDetectorRef
constructor(private cdr: ChangeDetectorRef) {}
// Sau subscribe:
this.cdr.markForCheck();

// Cách 2: Dùng async pipe trong template (khuyến nghị hơn)
orders$ = this.orderService.getAllOrders();
// Template: *ngFor="let o of orders$ | async"
```

### 3.2 Auth Interceptor
Đảm bảo `auth.interceptor.ts` đang attach JWT token vào tất cả request đến `/api/admin/*`. Kiểm tra `app.config.ts` đã register interceptor chưa.

### 3.3 CORS & Backend chạy song song
Backend cần chạy trên `localhost:3000` khi dev Angular. Cần chắc chắn backend online trước khi test.

### 3.4 Promotion route mismatch
- Frontend PromotionService: gọi `/api/admin/promotions`  
- Backend route: mounted tại `/api/promotions` trong `server.js`  
→ **Phải sửa PromotionService trước tiên (TASK 1)**

---

## 4. Thứ tự thực hiện đề xuất

```
TASK 1  →  TASK 2  →  TASK 3  →  TASK 4  →  TASK 5  →  TASK 6  →  TASK 7
(5m)       (15m)      (90m)      (60m)      (60m)      (90m)      (60m)
```

**Tổng ước tính: ~6–7 giờ làm việc**

---

## 5. Scope KHÔNG cần làm thêm

- ❌ Thêm backend API mới (tất cả API đã đủ)
- ❌ Thay đổi database schema (models đã đủ)
- ❌ Thay đổi routing / auth guard (đã hoạt động)
- ❌ Sửa user-facing pages (out of scope)

---

## 6. Kiểm tra sau khi hoàn thành

| Test Case | Kỳ vọng |
|-----------|---------|
| Admin login → vào `/admin/products` | Danh sách sản phẩm load từ DB |
| Click "Thêm sản phẩm" → điền form → Save | Bowl mới xuất hiện trong danh sách + trong DB |
| Click "Sửa" → thay đổi giá → Save | Giá cập nhật real-time + trong DB |
| Click "Xóa" bowl | Bowl biến mất khỏi danh sách + trong DB |
| Vào `/admin/orders` | Đơn hàng từ DB hiển thị, không phải dữ liệu giả |
| Cập nhật status đơn hàng | Status thay đổi trong DB |
| Vào `/admin/customers` | Danh sách user từ DB |
| Click xem chi tiết customer | Hiển thị đơn hàng thật của customer đó |
| Vào `/admin/promotions` | Danh sách voucher từ DB |
| Tạo/Sửa/Xóa/Toggle promotion | CRUD hoạt động với DB |
| Vào `/admin/reports` | KPI cards + bảng load từ DB |
