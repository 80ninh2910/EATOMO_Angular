# 📋 UI_PLAN — Kế Hoạch Hoàn Thiện User UI

> Ngày tạo: 11/03/2026  
> Mục tiêu: Hoàn thiện toàn bộ giao diện user-facing để nộp đồ án  
> Trạng thái: Backend + Services đã xong → Tập trung vào UI/UX

---

## 1. TỔNG QUAN HIỆN TRẠNG

### ✅ Đã hoàn thành
- Backend Express.js + Mongoose — 40 bowls, auth, orders, vouchers, admin APIs
- Angular Services — AuthService, BowlService, CartService, OrderService, PromotionService, DashboardService
- AuthInterceptor + AuthGuard/AdminGuard
- Routing + SSR config

### ❌ Cần hoàn thiện (User UI)
| Mức độ | Số lượng | Mô tả |
|--------|----------|-------|
| 🔴 P0 — Breaking | 2 | Bug khiến trang không hoạt động |
| 🟠 P1 — Major | 5 | Tính năng quan trọng bị thiếu UI |
| 🟡 P2 — Medium | 4 | Cải thiện UX đáng kể |
| 🟢 P3 — Polish | 4 | Thống nhất code, dọn dẹp |

---

## 2. ĐÁNH GIÁ TỪNG COMPONENT

| Component | Backend | Loading | Error | Empty | UI | Điểm |
|-----------|---------|---------|-------|-------|-----|------|
| Header | ✅ Auth+Cart | — | — | — | ✅ | ⭐⭐⭐⭐ |
| Footer | N/A | — | — | — | ✅ | ⭐⭐⭐⭐ |
| Home | ⚠️ Hardcoded bowls | ❌ | ❌ | — | ✅ | ⭐⭐⭐ |
| Login | ✅ Full | ❌ Không hiển thị | ✅ | — | ✅ | ⭐⭐⭐⭐ |
| Register | ✅ Full | ✅ | ✅ | — | ✅ | ⭐⭐⭐⭐½ |
| Our Bowls | ✅ Full | ❌ | ❌ | ❌ | ✅✅ | ⭐⭐⭐½ |
| Build Your Own | ⚠️ Partial | — | — | — | ✅ | ⭐⭐⭐½ |
| Orders | ✅ Full | ⚠️ | ❌ Không hiển thị | ✅ | ⚠️ | ⭐⭐⭐ |
| About Us | N/A | — | — | — | ✅✅ | ⭐⭐⭐⭐½ |
| Stores | N/A | — | — | — | ✅✅ | ⭐⭐⭐⭐ |
| FAQs | N/A | — | — | — | ❌ Bug | ⭐⭐⭐ |

---

## 3. CHI TIẾT TỪNG TASK

---

### 🔴 TASK 1 — Fix FaqsComponent OnPush bug
**File:** `src/app/pages/faqs/faqs.component.ts`  
**Vấn đề:** Dùng `ChangeDetectionStrategy.OnPush` nhưng mutate trực tiếp `faq.isOpen = !faq.isOpen`. OnPush chỉ detect thay đổi khi reference thay đổi → accordion **không mở/đóng** được.

**Giải pháp:** Chuyển `faqs` sang `signal<FAQ[]>` và dùng immutable update:
```typescript
faqs = signal<FAQ[]>([...]);

toggleFaq(index: number): void {
  this.faqs.update(list =>
    list.map((faq, i) => i === index ? { ...faq, isOpen: !faq.isOpen } : faq)
  );
}
```

Ngoài ra sửa template: thay `*ngIf="faq.isOpen"` bằng `@if (faq.isOpen)` và dùng `@for` thay `*ngFor`.

**Ước lượng:** ~30 phút

---

### 🔴 TASK 2 — Fix OrdersComponent missing RouterModule
**File:** `src/app/pages/orders/orders.component.ts`  
**Vấn đề:** Template có `routerLink="/our-bowls"` nhưng component không import `RouterModule` → runtime error khi giỏ hàng trống.

**Giải pháp:** Thêm `RouterModule` vào `imports`:
```typescript
imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent]
```

**Ước lượng:** ~5 phút

---

### 🟠 TASK 3 — Thêm Voucher UI vào Orders template
**File:** `src/app/pages/orders/orders.component.html`  
**Vấn đề:** Logic voucher đã có trong .ts (validateVoucher, removeVoucher, voucherCode, discountAmount) nhưng template **KHÔNG CÓ** input voucher hay hiển thị discount. User không thể nhập mã giảm giá.

**Giải pháp:** Thêm sau Order Summary, trước Customer Info:
```html
<!-- Voucher Section -->
<div class="voucher-section">
  <h3>Voucher Code</h3>
  <div class="voucher-input-group">
    <input type="text" [(ngModel)]="voucherCode" name="voucher" 
           placeholder="Enter voucher code" [disabled]="voucherValidation()?.valid">
    @if (!voucherValidation()?.valid) {
      <button (click)="validateVoucher()" [disabled]="isValidatingVoucher() || !voucherCode">
        {{ isValidatingVoucher() ? 'Checking...' : 'Apply' }}
      </button>
    } @else {
      <button class="remove-voucher-btn" (click)="removeVoucher()">Remove</button>
    }
  </div>
  @if (voucherValidation(); as v) {
    <p [class]="v.valid ? 'voucher-success' : 'voucher-error'">{{ v.message }}</p>
  }
</div>
```

Cũng thêm dòng Discount vào Order Summary:
```html
@if (discountAmount() > 0) {
  <div class="summary-row discount-row">
    <span>Discount:</span>
    <span class="discount">-₫{{ discountAmount() | number }}</span>
  </div>
}
```

**Ước lượng:** ~45 phút (HTML + CSS)

---

### 🟠 TASK 4 — Hiển thị Checkout feedback (success/error)
**Files:** `src/app/pages/orders/orders.component.html` + `.css`  
**Vấn đề:** Signals `checkoutSuccess` và `checkoutError` được set trong .ts nhưng **KHÔNG HIỂN THỊ** trong template. User đặt hàng xong không thấy phản hồi gì.

**Giải pháp:** Thêm feedback messages + order confirmation view:
```html
@if (checkoutError()) {
  <div class="alert alert-error">
    <i class="fas fa-exclamation-circle"></i> {{ checkoutError() }}
  </div>
}
@if (checkoutSuccess()) {
  <div class="order-success">
    <i class="fas fa-check-circle"></i>
    <h2>Order Placed Successfully!</h2>
    <p>{{ checkoutSuccess() }}</p>
    <button routerLink="/our-bowls" class="btn btn-primary">Continue Shopping</button>
  </div>
}
```

Cũng update nút Checkout hiển thị loading state:
```html
<button class="checkout-btn" [disabled]="cartService.isEmpty() || isCheckingOut()">
  @if (isCheckingOut()) {
    <i class="fas fa-spinner fa-spin"></i> Processing...
  } @else {
    <i class="fas fa-check-circle"></i> Place Order
  }
</button>
```

**Ước lượng:** ~30 phút

---

### 🟠 TASK 5 — Thêm Loading/Error states cho OurBowls
**Files:** `src/app/pages/our-bowls/our-bowls.component.ts` + `.html`  
**Vấn đề:** Không có loading spinner khi đang fetch bowls từ API. Nếu API chậm/lỗi → trang trắng. Không có empty state.

**Giải pháp:** Thêm signals `isLoading` + `loadError`:
```typescript
isLoading = signal(true);
loadError = signal('');

ngOnInit(): void {
  this.bowlService.getBowls().subscribe({
    next: (bowls) => { this.allBowls = bowls; this.isLoading.set(false); },
    error: (err) => { this.loadError.set('Failed to load bowls'); this.isLoading.set(false); }
  });
}
```

Template:
```html
@if (isLoading()) {
  <div class="loading-spinner">
    <div class="spinner"></div>
    <p>Loading bowls...</p>
  </div>
} @else if (loadError()) {
  <div class="error-state">
    <i class="fas fa-exclamation-triangle"></i>
    <p>{{ loadError() }}</p>
    <button (click)="retryLoad()">Try Again</button>
  </div>
} @else {
  <!-- existing bowl sections -->
}
```

**Ước lượng:** ~45 phút

---

### 🟠 TASK 6 — Hiển thị Loading state trên Login buttons
**File:** `src/app/pages/login/login.component.html`  
**Vấn đề:** Signals `userLoading`/`adminLoading` đã có trong .ts nhưng template chỉ hiện `<button type="submit">Login</button>` — không hiển thị trạng thái loading, không disable khi đang gọi API.

**Giải pháp:**
```html
<button type="submit" [disabled]="userForm.invalid || userLoading()">
  {{ userLoading() ? 'Logging in...' : 'Login' }}
</button>
```

Tương tự cho admin form.

**Ước lượng:** ~15 phút

---

### 🟠 TASK 7 — Thêm Order History cho user
**Files:** `src/app/pages/orders/orders.component.ts` + `.html` + `.css`  
**Vấn đề:** User đã đăng nhập nhưng không có cách xem lại các đơn hàng đã đặt. Chỉ có giỏ hàng + checkout.

**Giải pháp:** Thêm tab "Order History" bên cạnh giỏ hàng:
```typescript
activeTab = signal<'cart' | 'history'>('cart');
orderHistory = signal<Order[]>([]);
isLoadingHistory = signal(false);

loadOrderHistory(): void {
  this.isLoadingHistory.set(true);
  this.orderService.getMyOrders().subscribe({
    next: (orders) => { this.orderHistory.set(orders); this.isLoadingHistory.set(false); },
    error: () => this.isLoadingHistory.set(false)
  });
}
```

Template: Tab header (Cart | Order History). Khi chọn History → hiển thị bảng đơn hàng với mã đơn, ngày, trạng thái, tổng tiền.

**Ước lượng:** ~1.5 giờ (HTML + CSS + TS)

---

### 🟡 TASK 8 — Tích hợp BowlService vào HomeComponent
**File:** `src/app/home.component.ts`  
**Vấn đề:** 6 bowls showcase trên trang chủ được hardcoded riêng trong component với interface `BowlItem` tự tạo, không liên kết với BowlService/backend. Nếu admin sửa giá bowl trên backend → trang chủ vẫn hiển thị giá cũ.

**Giải pháp:** Inject BowlService, fetch featured bowls (isFeatured=true hoặc list IDs cụ thể):
```typescript
featuredBowls: Bowl[] = [];

ngOnInit() {
  this.bowlService.getBowls().subscribe(bowls => {
    this.featuredBowls = bowls.filter(b => b.isFeatured).slice(0, 6);
    // Fallback nếu không có featured: lấy 6 bowls đầu tiên
    if (this.featuredBowls.length === 0) {
      this.featuredBowls = bowls.slice(0, 6);
    }
  });
}
```

Cũng cần map Bowl → format mà template cần (image paths, etc.).

**Ước lượng:** ~45 phút

---

### 🟡 TASK 9 — Fix Header memory leak
**File:** `src/app/shared/header/header.component.ts`  
**Vấn đề:** `router.events.subscribe()` trong ngOnInit nhưng ngOnDestroy để trống → subscription không bị hủy → memory leak.

**Giải pháp:** Dùng `DestroyRef` + `takeUntilDestroyed`:
```typescript
private destroyRef = inject(DestroyRef);

ngOnInit(): void {
  this.updateHomePageStatus();
  this.router.events
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => this.updateHomePageStatus());
}
```

**Ước lượng:** ~10 phút

---

### 🟡 TASK 10 — Thay alert() bằng Toast notification
**File:** `src/app/pages/build-your-own/build-your-own.component.ts`  
**Vấn đề:** Dùng `alert('Bowl added to bag!')` và `alert('Please select all...')` — không chuyên nghiệp.

**Giải pháp:** Tạo simple toast component hoặc dùng signal-based inline notification:
```typescript
toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

showToast(message: string, type: 'success' | 'error'): void {
  this.toast.set({ message, type });
  setTimeout(() => this.toast.set(null), 3000);
}
```

Template:
```html
@if (toast(); as t) {
  <div class="toast" [class]="'toast-' + t.type">{{ t.message }}</div>
}
```

**Ước lượng:** ~30 phút

---

### 🟡 TASK 11 — Cải thiện OurBowls performance (template getters)
**File:** `src/app/pages/our-bowls/our-bowls.component.ts` + `.html`  
**Vấn đề:** Template gọi `getLowCalBowls()`, `getBalancedBowls()` etc. — mỗi change detection cycle gọi lại → performance kém.

**Giải pháp:** Chuyển sang computed signals hoặc cache kết quả:
```typescript
private allBowlsSignal = signal<Bowl[]>([]);

lowCalBowls = computed(() => this.allBowlsSignal().filter(b => b.category === 'low-cal'));
balancedBowls = computed(() => this.allBowlsSignal().filter(b => b.category === 'balanced'));
highProteinBowls = computed(() => this.allBowlsSignal().filter(b => b.category === 'high-protein'));
vegetarianBowls = computed(() => this.allBowlsSignal().filter(b => b.category === 'vegetarian'));
```

**Ước lượng:** ~30 phút

---

### 🟢 TASK 12 — Thống nhất template syntax
**Files:** Nhiều components  
**Vấn đề:** Một số component dùng `*ngFor`/`*ngIf` (Angular cũ), một số dùng `@for`/`@if` (Angular 17+). Không nhất quán.

**Giải pháp:** Chuyển tất cả sang `@for`/`@if`/`@switch` (Angular 19 syntax):
- `our-bowls.component.html` — 15+ instances `*ngFor`/`*ngIf`
- `home.component.html` — `*ngFor`
- `about-us.component.html` — `*ngFor`
- `stores.component.html` — `*ngFor`
- `faqs.component.html` — `*ngFor`/`*ngIf`

**Ước lượng:** ~1 giờ

---

### 🟢 TASK 13 — Dọn dẹp downloadRecipe() stubs
**Files:** `home.component.ts`, `our-bowls.component.ts`, `build-your-own.component.ts`  
**Vấn đề:** `downloadRecipe()` chỉ `console.log()` — tính năng chết.

**Giải pháp:** Hoặc implement thật (generate PDF) hoặc xóa button trong template.  
Đề xuất: Giữ button nhưng hiện toast "Coming soon!" thay vì console.log.

**Ước lượng:** ~15 phút

---

### 🟢 TASK 14 — Cập nhật Footer placeholder data
**File:** `src/app/shared/footer/footer.component.html`  
**Vấn đề:** Social links → `#`, Hotline → `1900 xxxx`.

**Giải pháp:** Điền thông tin thật hoặc thông tin mẫu phù hợp đồ án.

**Ước lượng:** ~10 phút

---

### 🟢 TASK 15 — CSS consistent variables
**Files:** `about-us.component.css`, `our-bowls.component.css`  
**Vấn đề:** Dùng CSS variables (`var(--primary-color)`, `var(--transition)`) nhưng không define trong component → phụ thuộc global CSS.

**Giải pháp:** Define CSS variables ở `:host` hoặc `:root` trong mỗi component CSS, hoặc đảm bảo `styles.css` define chúng globally.

**Ước lượng:** ~20 phút

---

## 4. KẾ HOẠCH THỰC HIỆN

### Phase 1 — Sửa bug nghiêm trọng (P0) ⏱️ ~35 phút
| # | Task | Ưu tiên | Thời gian |
|---|------|---------|-----------|
| 1 | Fix FaqsComponent OnPush bug | 🔴 P0 | 30 phút |
| 2 | Fix OrdersComponent missing RouterModule | 🔴 P0 | 5 phút |

### Phase 2 — Hoàn thiện tính năng chính (P1) ⏱️ ~3.5 giờ
| # | Task | Ưu tiên | Thời gian |
|---|------|---------|-----------|
| 3 | Thêm Voucher UI vào Orders | 🟠 P1 | 45 phút |
| 4 | Hiển thị Checkout feedback | 🟠 P1 | 30 phút |
| 5 | Loading/Error states cho OurBowls | 🟠 P1 | 45 phút |
| 6 | Loading state trên Login buttons | 🟠 P1 | 15 phút |
| 7 | Order History cho user | 🟠 P1 | 1.5 giờ |

### Phase 3 — Cải thiện UX (P2) ⏱️ ~2 giờ
| # | Task | Ưu tiên | Thời gian |
|---|------|---------|-----------|
| 8 | Tích hợp BowlService vào Home | 🟡 P2 | 45 phút |
| 9 | Fix Header memory leak | 🟡 P2 | 10 phút |
| 10 | Toast notification thay alert() | 🟡 P2 | 30 phút |
| 11 | OurBowls computed signals | 🟡 P2 | 30 phút |

### Phase 4 — Polish & consistency (P3) ⏱️ ~1.5 giờ
| # | Task | Ưu tiên | Thời gian |
|---|------|---------|-----------|
| 12 | Thống nhất template syntax @for/@if | 🟢 P3 | 1 giờ |
| 13 | Dọn dẹp downloadRecipe() stubs | 🟢 P3 | 15 phút |
| 14 | Cập nhật Footer placeholder | 🟢 P3 | 10 phút |
| 15 | CSS consistent variables | 🟢 P3 | 20 phút |

---

## 5. TỔNG KẾT

| | |
|---|---|
| **Tổng số tasks** | 15 |
| **Thời gian ước lượng** | ~7.5 giờ |
| **Tối thiểu để nộp** | Phase 1 + Phase 2 = ~4 giờ (7 tasks) |
| **Khuyến nghị** | Phase 1 → Phase 2 → Phase 3 (đủ điểm cao) |
| **Full polish** | Thêm Phase 4 nếu còn thời gian |

---

## 6. TRẠNG THÁI THỰC HIỆN

| # | Task | Status |
|---|------|--------|
| 1 | Fix FaqsComponent OnPush bug | ⬜ Chưa |
| 2 | Fix OrdersComponent missing RouterModule | ⬜ Chưa |
| 3 | Thêm Voucher UI vào Orders | ⬜ Chưa |
| 4 | Hiển thị Checkout feedback | ⬜ Chưa |
| 5 | Loading/Error states cho OurBowls | ⬜ Chưa |
| 6 | Loading state trên Login buttons | ⬜ Chưa |
| 7 | Order History cho user | ⬜ Chưa |
| 8 | Tích hợp BowlService vào Home | ⬜ Chưa |
| 9 | Fix Header memory leak | ⬜ Chưa |
| 10 | Toast notification thay alert() | ⬜ Chưa |
| 11 | OurBowls computed signals | ⬜ Chưa |
| 12 | Thống nhất template syntax | ⬜ Chưa |
| 13 | Dọn dẹp downloadRecipe() stubs | ⬜ Chưa |
| 14 | Cập nhật Footer placeholder | ⬜ Chưa |
| 15 | CSS consistent variables | ⬜ Chưa |
