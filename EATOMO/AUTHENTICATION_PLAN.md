# Kế hoạch Authentication & Checkout Flow

## 1. FLOW TỔNG QUAN

### Khi user chưa đăng nhập:
```
[Browse menu] 
    ↓
[Add to cart] (Không cần login)
    ↓
[View cart]
    ↓
[Click "Thanh toán"]
    ↓
[Kiểm tra login] → CHƯA LOGIN
    ↓
[Redirect to /login?returnUrl=/checkout]
    ↓
[User đăng nhập]
    ↓
[Auto redirect về /checkout]
    ↓
[Tiếp tục thanh toán]
```

### Khi user đã đăng nhập:
```
[Browse menu] 
    ↓
[Add to cart]
    ↓
[View cart]
    ↓
[Click "Thanh toán"]
    ↓
[Kiểm tra login] → ĐÃ LOGIN
    ↓
[Trực tiếp vào /checkout]
```

---

## 2. CẤU TRÚC ĐÃ TẠO

### ✅ AuthService (src/app/services/auth.service.ts)
**Chức năng:**
- `login()` - Đăng nhập user/admin
- `register()` - Đăng ký tài khoản mới
- `logout()` - Đăng xuất
- `isLoggedIn()` - Kiểm tra đã đăng nhập chưa
- `isAdmin()` - Kiểm tra có phải admin không
- `setRedirectUrl()` - Lưu URL để redirect sau khi login
- `getRedirectUrl()` - Lấy URL đã lưu

**State Management:**
- Signal-based: `currentUser` signal
- LocalStorage persistence: Auto-restore session khi refresh

### ✅ CartService (src/app/services/cart.service.ts)
**Chức năng:**
- `addToCart()` - Thêm món vào giỏ
- `removeFromCart()` - Xóa món khỏi giỏ
- `updateQuantity()` - Cập nhật số lượng
- `clearCart()` - Xóa toàn bộ giỏ hàng
- `isEmpty()` - Kiểm tra giỏ rỗng

**Computed Signals:**
- `totalItems` - Tổng số món
- `totalPrice` - Tổng giá trị giỏ hàng

**Persistence:**
- LocalStorage: Giỏ hàng không mất khi refresh

### ✅ Auth Guards (src/app/guards/auth.guard.ts)
**authGuard:**
- Bảo vệ routes yêu cầu login
- Auto redirect to /login nếu chưa đăng nhập
- Lưu returnUrl để quay lại sau khi login

**adminGuard:**
- Chỉ cho phép admin truy cập
- Redirect about /home nếu user thường
- Redirect to /login nếu chưa đăng nhập

---

## 3. ROUTES CONFIGURATION

### App Routes (app.routes.ts)
```typescript
import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: '', component: HomeComponent },
  { path: 'our-bowls', component: OurBowlsComponent },
  { path: 'stores', component: StoresComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'faqs', component: FaqsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Protected routes - Yêu cầu login
  { 
    path: 'checkout', 
    component: CheckoutComponent,
    canActivate: [authGuard]  // 👈 Guard bảo vệ
  },
  { 
    path: 'orders', 
    component: OrdersComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  
  // Admin routes
  { 
    path: 'admin', 
    component: AdminComponent,
    canActivate: [adminGuard]  // 👈 Chỉ admin
  }
];
```

---

## 4. THUẬT TOÁN KIỂM TRA LOGIN

### Cách hoạt động:

#### A. Khi user click "Thanh toán":
```typescript
// Trong component Cart/BuildYourOwn
onCheckout(): void {
  // Option 1: Let guard handle it
  this.router.navigate(['/checkout']);
  // → Guard sẽ tự động kiểm tra và redirect nếu cần

  // Option 2: Manual check (nếu cần custom logic)
  if (!this.authService.isLoggedIn()) {
    // Hiện popup hoặc alert
    alert('Please login to checkout');
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/checkout' }
    });
  } else {
    this.router.navigate(['/checkout']);
  }
}
```

#### B. Auth Guard tự động:
```typescript
// Guard chạy TRƯỚC khi vào route
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  
  // 1. Kiểm tra signal currentUser
  if (authService.isLoggedIn()) {
    return true;  // ✅ Cho phép truy cập
  }
  
  // 2. Lưu URL hiện tại
  authService.setRedirectUrl(state.url);
  
  // 3. Redirect to login
  router.navigate(['/login']);
  
  return false;  // ❌ Chặn truy cập
};
```

#### C. Sau khi login thành công:
```typescript
// Trong LoginComponent
async onUserLogin(): Promise<void> {
  const result = await this.authService.login(credentials);
  
  if (result.success) {
    // 1. Lấy URL đã lưu
    const redirectUrl = this.authService.getRedirectUrl();
    // → Trả về '/checkout' hoặc '/' nếu không có
    
    // 2. Auto redirect
    this.router.navigate([redirectUrl]);
  }
}
```

---

## 5. STATE PERSISTENCE

### LocalStorage Strategy:

**currentUser:**
```typescript
// Login → Lưu vào localStorage
localStorage.setItem('currentUser', JSON.stringify(user));

// Refresh page → Auto restore
constructor() {
  this.loadUserFromStorage();
}

// Logout → Xóa khỏi localStorage
localStorage.removeItem('currentUser');
```

**cart:**
```typescript
// Mỗi lần thay đổi giỏ hàng → Auto save
private saveCart(): void {
  localStorage.setItem('cart', JSON.stringify(this.cartItems));
}

// Load khi init service
constructor() {
  this.loadCart();
}
```

---

## 6. CÁC TRƯỜNG HỢP ĐẶC BIỆT

### Trường hợp 1: User thêm món vào giỏ, logout, login lại
**Giải pháp:** Cart lưu trong localStorage → Không mất dữ liệu

### Trường hợp 2: User đã login nhưng session hết hạn (khi có backend)
**Giải pháp:**
```typescript
// HTTP Interceptor kiểm tra 401 response
if (error.status === 401) {
  authService.logout();
  authService.setRedirectUrl(currentUrl);
  router.navigate(['/login']);
}
```

### Trường hợp 3: User vào /checkout trực tiếp (bookmark)
**Giải pháp:** Guard chặn → Redirect to /login → returnUrl saved

### Trường hợp 4: User logout khi đang ở checkout
**Giải pháp:**
```typescript
logout(): void {
  this.currentUserSignal.set(null);
  localStorage.removeItem('currentUser');
  // Cart vẫn giữ nguyên trong localStorage
  this.router.navigate(['/']);
}
```

---

## 7. TIẾP THEO CẦN LÀM

### ⬜ Checkout Component
- Form nhập địa chỉ giao hàng
- Chọn phương thức thanh toán
- Review đơn hàng
- Submit order

### ⬜ Orders Component
- Lịch sử đơn hàng
- Chi tiết từng đơn
- Tracking status

### ⬜ Header Component Update
- Hiển thị user info khi đã login
- Cart icon với badge số lượng
- Dropdown menu (Profile, Orders, Logout)

### ⬜ Backend Integration
- Thay mock login/register bằng HTTP calls
- JWT token authentication
- Session management
- Order API endpoints

---

## 8. CODE EXAMPLE

### Trong Header Component:
```typescript
export class HeaderComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  
  currentUser = this.authService.currentUser;
  cartItemCount = this.cartService.totalItems;
  
  onLogout(): void {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      this.authService.logout();
    }
  }
}
```

### Trong Header Template:
```html
<nav class="header">
  <!-- Cart Icon -->
  <a routerLink="/cart" class="cart-icon">
    <i class="fas fa-shopping-cart"></i>
    @if (cartItemCount() > 0) {
      <span class="badge">{{ cartItemCount() }}</span>
    }
  </a>
  
  <!-- User Menu -->
  @if (currentUser(); as user) {
    <div class="user-menu">
      <span>Hello, {{ user.username }}</span>
      <a routerLink="/orders">My Orders</a>
      <a routerLink="/profile">Profile</a>
      <button (click)="onLogout()">Logout</button>
    </div>
  } @else {
    <a routerLink="/login" class="btn-login">Login</a>
  }
</nav>
```

---

## SUMMARY

✅ **Đã có:**
- AuthService với login/register/logout
- CartService với add/remove/update
- Auth Guards để protect routes
- Redirect flow hoàn chỉnh

📝 **Cần làm tiếp:**
- Checkout page
- Orders page
- Update Header với cart badge & user menu
- Backend integration

🔐 **Security:**
- Password validation ✅
- Protected routes ✅
- Session persistence ✅
- XSS protection (cần thêm khi có backend)
