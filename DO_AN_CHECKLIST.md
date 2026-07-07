# EATOMO Android — Kế Hoạch Đồ Án Chi Tiết
> Cập nhật: 2026-06-09 | Team: 5 người | Timeline: 14 tuần (7 Sprints × 2 tuần)

---

## 🔍 PHẦN 1 — PHÂN TÍCH GAP BACKEND

> Sau khi đọc kỹ toàn bộ source code backend, đây là danh sách **những điểm còn thiếu hoặc cần bổ sung** để Android app hoạt động đúng.

---

### 🔴 CRITICAL — Bắt buộc phải sửa trước khi mobile connect

#### GAP-01: Thiếu endpoint `GET /api/auth/profile`
**Vấn đề**: Route file chỉ có `POST /login` và `POST /register`. Không có endpoint trả về thông tin user hiện tại từ JWT token.  
**Android cần**: Mở app → kiểm tra token còn hạn → fetch profile → hiển thị tên user trên header.

```javascript
// Cần thêm vào auth.routes.js:
router.get('/profile', authMiddleware, authController.getProfile);

// Cần thêm vào auth.controller.js:
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  res.json({ id: user._id, username: user.username, email: user.email,
             fullName: user.fullName, phone: user.phone, role: user.role });
};
```

#### GAP-02: Thiếu endpoint `PATCH /api/auth/profile` (Update user info)
**Vấn đề**: User không thể cập nhật fullName, phone, address từ mobile app.  
**Android cần**: Profile screen → edit → save.

```javascript
// Cần thêm:
router.patch('/profile', authMiddleware, authController.updateProfile);

exports.updateProfile = async (req, res) => {
  const allowed = ['fullName', 'phone', 'address'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
    .select('-passwordHash');
  res.json(user);
};
```

#### GAP-03: Thiếu endpoint `PATCH /api/auth/change-password`
**Vấn đề**: Không có cách đổi mật khẩu từ app.  
**Android cần**: Profile → Change Password screen.

```javascript
router.patch('/change-password', authMiddleware, authController.changePassword);
```

#### GAP-04: CORS chưa xử lý đúng cho mobile client
**Vấn đề**: Android app HTTP request **không gửi `Origin` header**. Backend hiện tại dùng CORS `origin` callback — khi `origin = undefined` thì `callback(null, true)` đang pass nhưng behavior này cần verify kỹ.  
**Fix**: Thêm custom header để identify mobile app, hoặc kiểm tra kỹ logic khi origin = null.

```javascript
// server.js — thêm vào CORS config:
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // ← mobile/Postman: OK
    // ... rest of logic
  },
  credentials: true
}));

// Hoặc thêm middleware nhận diện mobile:
app.use((req, res, next) => {
  const platform = req.headers['x-app-platform'];
  if (platform === 'android') res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
```

#### GAP-05: Thiếu `GET /api/bowls/featured` — Bowl nổi bật cho Home screen
**Vấn đề**: Home screen Android cần hiển thị 6 bowls nổi bật. Hiện chỉ có `GET /api/bowls` (trả toàn bộ 50 bowls).  
**Android cần**: Gọi riêng để lấy `isFeatured: true` mà không tải 50 bowls.

```javascript
// bowl.routes.js — thêm:
router.get('/featured', bowlController.getFeaturedBowls);

exports.getFeaturedBowls = async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const bowls = await Bowl.find({ isFeatured: true, inStock: true }).limit(limit);
  res.json(bowls);
};
```

#### GAP-06: Thiếu `GET /api/bowls/:id` trong bowl routes
**Vấn đề**: Đọc `bowl.routes.js` — chỉ có `GET /` (tất cả) nhưng **không có `GET /:id`** (detail). Android cần show Bowl Detail screen.

```javascript
// bowl.routes.js — thêm:
router.get('/:id', bowlController.getBowlById);

exports.getBowlById = async (req, res) => {
  const bowl = await Bowl.findById(req.params.id);
  if (!bowl) return res.status(404).json({ success: false, message: 'Bowl not found' });
  res.json(bowl);
};
```

---

### 🟡 IMPORTANT — Cần có để app đầy đủ chức năng

#### GAP-07: Thiếu `PATCH /api/orders/:id/cancel` không trả về order data đủ
**Vấn đề**: Cancel order hiện chỉ trả `{ success: true, message: 'Order cancelled' }`. Android cần order object mới để refresh UI.

```javascript
// Fix: trả về order sau khi cancel
res.json({ success: true, message: 'Order cancelled', order: { ...order.toJSON() } });
```

#### GAP-08: `GET /api/orders` không có pagination
**Vấn đề**: Trả toàn bộ orders của user (có thể rất nhiều). Trên mobile cần lazy load.

```javascript
exports.getMyOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [orders, total] = await Promise.all([
    Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments({ userId: req.user.id })
  ]);
  res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
};
```

#### GAP-09: Thiếu FCM Push Notification khi order status thay đổi
**Vấn đề**: Khi admin cập nhật `PATCH /api/admin/orders/:id/status`, backend không gửi push notification đến user.  
**Android cần**: Nhận thông báo real-time khi đơn chuyển sang `confirmed`, `delivering`, `completed`.

```javascript
// Cần thêm:
// 1. Model Device để lưu FCM token
// 2. POST /api/devices/register  — Android gửi FCM token lên
// 3. DELETE /api/devices/:token  — unregister khi logout
// 4. Trigger firebase-admin.messaging().send() trong updateOrderStatus
```

**Files mới cần tạo**:
```
backend/models/Device.js
backend/controllers/device.controller.js
backend/routes/device.routes.js
backend/utils/fcm.js  ← firebase-admin integration
```

#### GAP-10: Thiếu `GET /api/vouchers/all` trả danh sách voucher cho user
**Vấn đề**: Route hiện tại `/api/vouchers/validate` (POST) chỉ validate code. User không thể xem danh sách voucher có sẵn.  
**Android cần**: Vouchers screen hiển thị tất cả voucher active.

```javascript
// Đã có exports.getPublicVouchers trong promotion.controller.js nhưng
// kiểm tra lại route: /api/promotions/all hoặc /api/vouchers/all
// Cần đảm bảo route public (không cần auth) và đúng path
```

#### GAP-11: Thiếu Response format thống nhất (`success`, `data`, `message`)
**Vấn đề**: Một số endpoint trả thẳng object (e.g. `res.json(bowls)`), một số trả `{ success: true, data: ... }`. Android cần parse nhất quán.

```javascript
// Cần chuẩn hóa, ví dụ:
// Trước: res.json(bowls)
// Sau:   res.json({ success: true, data: bowls, total: bowls.length })
```

#### GAP-12: Thiếu error response format thống nhất
**Vấn đề**: Error messages mix giữa `{ success: false, message: '...' }` và `{ error: '...' }`. Android interceptor cần parse nhất quán.

---

### 🟢 NICE-TO-HAVE — Cải thiện UX nhưng không bắt buộc

#### GAP-13: Thiếu `POST /api/auth/refresh-token`
**Android cần**: Token hết hạn sau 7 ngày → auto refresh thay vì force logout.

#### GAP-14: Thiếu `GET /api/bowls/search?q=keyword`
**Android cần**: Search bar trong Bowl List screen.

#### GAP-15: Thiếu `POST /api/upload/avatar`
**Android cần**: Upload ảnh profile từ Camera/Gallery.

#### GAP-16: Thiếu Keep-Alive endpoint cho Render cold start
**Vấn đề**: Render free tier ngủ sau 15 phút không hoạt động. Cold start ~30s gây UX tệ.

```javascript
// Thêm vào server.js:
app.get('/ping', (req, res) => res.json({ status: 'alive', ts: Date.now() }));

// Dùng cron service (cron-job.org) ping mỗi 10 phút:
// GET https://your-render-url.onrender.com/ping
```

---

### 📋 Tóm tắt Backend Gaps

| # | Gap | Mức độ | Effort | Cần xong trước Sprint |
|---|-----|--------|--------|----------------------|
| 01 | GET /api/auth/profile | 🔴 Critical | 1h | Sprint 1 |
| 02 | PATCH /api/auth/profile | 🔴 Critical | 1h | Sprint 1 |
| 03 | PATCH /api/auth/change-password | 🟡 Important | 1h | Sprint 2 |
| 04 | CORS mobile fix + verify | 🔴 Critical | 30m | Sprint 1 |
| 05 | GET /api/bowls/featured | 🔴 Critical | 1h | Sprint 1 |
| 06 | GET /api/bowls/:id | 🔴 Critical | 30m | Sprint 1 |
| 07 | Cancel order trả đủ data | 🟡 Important | 30m | Sprint 4 |
| 08 | Orders pagination | 🟡 Important | 1h | Sprint 4 |
| 09 | FCM push notification | 🟡 Important | 1 ngày | Sprint 5 |
| 10 | GET /api/vouchers/all | 🟡 Important | 30m | Sprint 4 |
| 11 | Response format chuẩn | 🟡 Important | 2h | Sprint 1 |
| 12 | Error format chuẩn | 🟡 Important | 1h | Sprint 1 |
| 13 | Refresh token | 🟢 Nice | 2h | Sprint 5 |
| 14 | Search bowls | 🟢 Nice | 1h | Sprint 3 |
| 15 | Upload avatar | 🟢 Nice | 2h | Sprint 5 |
| 16 | Keep-alive /ping | 🟡 Important | 15m | Sprint 1 |

**Tổng effort backend fixes**: ~12–14 giờ (2 ngày) — nên làm trong Sprint 1.

---

## ✅ PHẦN 2 — CHECKLIST THEO PHASE

> Quy ước:
> - `[ ]` = Chưa làm
> - `[/]` = Đang làm  
> - `[x]` = Hoàn thành
> - 🔴 = Blocking (phải xong trước step tiếp)
> - 🟡 = Important
> - 🟢 = Nice-to-have

---

## SPRINT 0 — PRE-SPRINT (Tuần 0, trước khi bắt đầu)
> **Mục tiêu**: Chuẩn bị môi trường, tooling, và fix backend critical gaps

### 0.1 Môi trường & Tooling

- [ ] 🔴 Cài Android Studio Hedgehog (2023.1.1+) cho tất cả thành viên
- [ ] 🔴 Cài JDK 17 (không phải 21 — tránh compatibility issues)
- [ ] 🔴 Tạo Android Emulator: API 34 (Pixel 6 profile)
- [ ] 🔴 Tạo Android Emulator: API 26 (kiểm tra min SDK)
- [ ] 🔴 Tạo GitHub repository: `eatomo-android`
- [ ] 🔴 Setup GitHub Projects board (Backlog → Refined → In Progress → Review → Done)
- [ ] 🔴 Tạo GitHub Issues cho tất cả User Stories (US-001 → US-064)
- [ ] 🔴 Tạo 7 GitHub Milestones: Sprint 1 → Sprint 7 với due dates
- [ ] 🟡 Cài Postman và import collection test các backend endpoints
- [ ] 🟡 Tạo Figma project: wireframe các màn hình chính (Home, BowlList, Cart, Checkout)
- [ ] 🟡 Tạo Google Sheets tracking: Velocity + Burndown chart template
- [ ] 🟢 Setup Discord server: channels #daily-standup #blockers #pr-review #general

### 0.2 Backend Critical Fixes (assign cho 1 người — ưu tiên cao nhất)

- [ ] 🔴 **GAP-04**: Verify CORS với Android emulator (test bằng Postman không có Origin header)
- [ ] 🔴 **GAP-01**: Thêm `GET /api/auth/profile` endpoint
- [ ] 🔴 **GAP-02**: Thêm `PATCH /api/auth/profile` endpoint
- [ ] 🔴 **GAP-05**: Thêm `GET /api/bowls/featured` endpoint
- [ ] 🔴 **GAP-06**: Thêm `GET /api/bowls/:id` endpoint
- [ ] 🔴 **GAP-16**: Thêm `GET /ping` keep-alive + setup cron-job.org
- [ ] 🟡 **GAP-11**: Chuẩn hóa response format `{ success, data, message }`
- [ ] 🟡 **GAP-12**: Chuẩn hóa error response format
- [ ] 🟡 Deploy backend changes lên Render — smoke test toàn bộ endpoints

### 0.3 Kickoff Meeting (2 giờ)

- [ ] Review ANDROID_APP_PLAN.md + AGILE_SCRUM_PLAN.md toàn team
- [ ] Assign roles: PO / Scrum Master / Lead Dev / Dev / Dev+QA
- [ ] Phân công Sprint 0 tasks
- [ ] Agree on: coding conventions, branch naming, PR rules, DoD

---

## SPRINT 1 — Foundation (Tuần 1–2)
> **Sprint Goal**: Android app build được, gọi API thành công, auth flow hoàn chỉnh

### 1.1 Project Setup

- [ ] 🔴 Tạo Android project: Package `com.eatomo.app`, Min SDK 26, Target SDK 34
- [ ] 🔴 Cấu hình `build.gradle` — thêm tất cả dependencies:
  - Hilt (DI)
  - Retrofit 2 + OkHttp 4 + Gson converter
  - Room DB + Room KTX
  - Navigation Component + Safe Args
  - Glide 4
  - Material Design 3
  - AndroidX Security (EncryptedSharedPreferences)
  - ViewModel + LiveData + Lifecycle KTX
  - Coroutines (kotlinx-coroutines-android)
  - Firebase BoM + Analytics + Crashlytics
- [ ] 🔴 Cấu hình `gradle.properties`: enable ViewBinding, Data Binding nếu cần
- [ ] 🔴 Setup build variants: `debug` / `release`
- [ ] 🔴 Thêm `local.properties`: BASE_URL cho debug và release
- [ ] 🟡 Setup ProGuard rules cho Retrofit, Gson, Hilt
- [ ] 🟡 Cấu hình `.gitignore`: loại `local.properties`, `google-services.json`, `*.jks`

### 1.2 Architecture Foundation

- [ ] 🔴 Tạo `EatomoApplication.java` với `@HiltAndroidApp`
- [ ] 🔴 Tạo `NetworkModule.java` (Hilt):
  - OkHttpClient với logging interceptor
  - AuthInterceptor (attach Bearer token)
  - NetworkInterceptor (check connectivity)
  - Retrofit instance với BASE_URL
- [ ] 🔴 Tạo `DatabaseModule.java` (Hilt): Room database instance
- [ ] 🔴 Tạo `RepositoryModule.java` (Hilt): bind interfaces → implementations
- [ ] 🔴 Tạo `TokenManager.java`: lưu/đọc/xóa JWT từ EncryptedSharedPreferences
- [ ] 🔴 Tạo `AuthInterceptor.java`: attach `Authorization: Bearer {token}`, handle 401
- [ ] 🟡 Tạo `BaseFragment.kt`, `BaseViewModel.kt`, `BaseAdapter.kt`
- [ ] 🟡 Tạo `Result.kt` sealed class: `Loading`, `Success<T>`, `Error`
- [ ] 🟡 Tạo `Resource.kt` + `NetworkBoundResource` cho Cache-then-Network

### 1.3 Data Layer — Remote

- [ ] 🔴 Tạo DTOs trong `data/remote/dto/`:
  - `LoginRequest.java`, `LoginResponse.java`, `RegisterRequest.java`
  - `BowlDto.java`, `OrderDto.java`, `CartItemDto.java`
  - `VoucherDto.java`, `UserDto.java`, `ChatMessageDto.java`
  - `ApiResponse<T>.java` (generic wrapper)
- [ ] 🔴 Tạo Retrofit interfaces trong `data/remote/api/`:
  - `AuthApi.java`: POST /register, POST /login, GET /profile, PATCH /profile
  - `BowlApi.java`: GET /bowls, GET /bowls/featured, GET /bowls/{id}
  - `OrderApi.java`: POST /orders, GET /orders, GET /orders/{id}, PATCH /orders/{id}/cancel
  - `ChatApi.java`: POST /chat
  - `PromotionApi.java`: POST /vouchers/validate, GET /vouchers/all

### 1.4 Data Layer — Local (Room)

- [ ] 🔴 Tạo Room entities: `BowlEntity.java`, `CartItemEntity.java`, `OrderEntity.java`
- [ ] 🔴 Tạo Room DAOs: `BowlDao.java`, `CartDao.java`, `OrderDao.java`
- [ ] 🔴 Tạo `EatomoDatabase.java` (singleton, Room.databaseBuilder)
- [ ] 🟡 Tạo Database migrations template

### 1.5 Domain Layer

- [ ] 🔴 Tạo Domain models: `Bowl.java`, `User.java`, `Order.java`, `CartItem.java`, `Voucher.java`
- [ ] 🔴 Tạo Repository interfaces: `AuthRepository.java`, `BowlRepository.java`, `CartRepository.java`, `OrderRepository.java`
- [ ] 🔴 Tạo Mappers: `BowlMapper.java` (DTO ↔ Domain ↔ Entity)

### 1.6 Navigation & UI Shell

- [ ] 🔴 Tạo `MainActivity.java` (single activity host) với `@AndroidEntryPoint`
- [ ] 🔴 Tạo `nav_graph.xml` với tất cả destinations và actions
- [ ] 🔴 Tạo Bottom Navigation (5 tabs: Home, Bowls, Cart, Orders, Profile)
- [ ] 🔴 Cấu hình `themes.xml` (Material 3):
  - Brand colors: `#2D6A4F` (green primary), `#40916C` (secondary), `#B7E4C7` (surface)
  - Typography: Inter font (Google Fonts)
  - Shape: rounded corners
- [ ] 🟡 Tạo `colors.xml`, `strings.xml`, `dimens.xml`
- [ ] 🟡 Import app icon và splash screen assets

### 1.7 Auth Flow

- [ ] 🔴 `LoginFragment.java/kt` + `LoginViewModel.kt`:
  - Form validation (empty check, email format)
  - Call `AuthApi.login()` → store token via TokenManager
  - Navigate to Home on success
  - Show error snackbar on failure
- [ ] 🔴 `RegisterFragment.java/kt` + `RegisterViewModel.kt`:
  - Form validation (username length, password match)
  - Call `AuthApi.register()` → auto-login
- [ ] 🔴 `AuthRepositoryImpl.java`: implement login, register, getProfile
- [ ] 🔴 `LoginUseCase.java`, `RegisterUseCase.java`
- [ ] 🔴 Auth guard logic: check TokenManager on app start → redirect Login hoặc Home

### 1.8 Sprint 1 Definition of Done

- [ ] App build thành công, không có compile errors
- [ ] Login với tài khoản thật → lưu JWT → navigate Home
- [ ] JWT được tự động attach vào API requests (verify qua Logcat)
- [ ] Token persist sau khi close và reopen app
- [ ] Unit test cho `LoginUseCase` và `TokenManager`
- [ ] PR reviewed và merged vào `develop`

---

## SPRINT 2 — Home Screen & Bowl List (Tuần 3–4)
> **Sprint Goal**: User đăng nhập → thấy Home đẹp → browse danh sách bowls

### 2.1 Home Screen

- [ ] 🔴 `HomeFragment.java/kt` + `HomeViewModel.kt`
- [ ] 🔴 Hero banner: ViewPager2 + 3 banner images với auto-scroll
- [ ] 🔴 Featured bowls horizontal RecyclerView (gọi `GET /api/bowls/featured`)
- [ ] 🔴 Loading state: Skeleton shimmer loading cho bowls
- [ ] 🔴 Error state: Retry button khi không có mạng
- [ ] 🟡 Categories quick-filter chips (Low-cal, Balanced, High-protein, Vegetarian)
- [ ] 🟡 Promotion banner (static hoặc từ API)
- [ ] 🟢 Parallax scroll header effect

### 2.2 Bowl List Screen

- [ ] 🔴 `BowlListFragment.java/kt` + `BowlListViewModel.kt`
- [ ] 🔴 RecyclerView với GridLayoutManager (2 cột)
- [ ] 🔴 `BowlAdapter.java` với ViewHolder pattern
- [ ] 🔴 Category filter: ChipGroup horizontal scroll (All / Low-cal / Balanced / High-protein / Vegetarian)
- [ ] 🔴 Gọi `GET /api/bowls?category={cat}` khi chọn filter
- [ ] 🔴 Pull-to-refresh (SwipeRefreshLayout)
- [ ] 🟡 Search bar với debounce 300ms (filter local hoặc `GET /api/bowls/search?q=`)
- [ ] 🟡 Grid/List toggle button
- [ ] 🟡 Skeleton loading 6 placeholder cards
- [ ] 🟡 Empty state khi không có bowl trong category

### 2.3 Bowl Detail Screen

- [ ] 🔴 `BowlDetailFragment.java/kt` + `BowlDetailViewModel.kt`
- [ ] 🔴 Hero image (Glide load với crossfade)
- [ ] 🔴 Nutrition info card: Calo / Protein / Carbs / Fat với progress bars
- [ ] 🔴 Ingredient description
- [ ] 🔴 Add to Cart FAB button với quantity selector
- [ ] 🔴 In-stock indicator (nếu `inStock = false` → disable Add to Cart)
- [ ] 🟡 Share button (deep link)
- [ ] 🟡 Related bowls RecyclerView (cùng category)

### 2.4 BowlRepository & Cache

- [ ] 🔴 `BowlRepositoryImpl.java`: Cache-then-Network (Room + API)
- [ ] 🔴 `GetBowlsUseCase.java`, `GetBowlByIdUseCase.java`, `FilterBowlsByCategoryUseCase.java`
- [ ] 🔴 Offline mode: hiển thị cached bowls khi không có mạng

### 2.5 Sprint 2 DoD

- [ ] Home screen hiển thị đúng layout với data thật từ API
- [ ] Filter bowls theo category hoạt động
- [ ] Bowl detail mở đúng khi tap item
- [ ] Offline mode: tắt mạng → mở Bowl List → vẫn thấy cached data
- [ ] Unit test: `BowlRepositoryImpl` với MockWebServer

---

## SPRINT 3 — Build Your Own & Cart (Tuần 5–6)
> **Sprint Goal**: User tự tạo bowl, add vào cart, quản lý cart

### 3.1 Build Your Own Screen

- [ ] 🔴 `BuildYourOwnFragment.java/kt` + `BuildYourOwnViewModel.kt`
- [ ] 🔴 Step wizard: ViewPager2 với 4 steps: Protein → Carbs → Side → Sauce
- [ ] 🔴 Step indicator (progress dots hoặc tab bar)
- [ ] 🔴 Mỗi step: horizontal RecyclerView các option cards với single select
- [ ] 🔴 Real-time calorie counter: base 89,000đ + calorie sum cập nhật mỗi khi chọn
- [ ] 🔴 "Previous" / "Next" navigation giữa steps
- [ ] 🔴 Step cuối: Summary card + "Add to Cart" button
- [ ] 🟡 Animation khi chuyển step (slide transition)
- [ ] 🟡 Ingredient image cho mỗi option

### 3.2 Cart Screen

- [ ] 🔴 `CartFragment.java/kt` + `CartViewModel.kt`
- [ ] 🔴 `CartRepositoryImpl.java`: lưu cart vào Room DB (persist qua lần mở app)
- [ ] 🔴 `AddToCartUseCase.java`, `UpdateCartQuantityUseCase.java`, `RemoveFromCartUseCase.java`
- [ ] 🔴 Cart list RecyclerView với swipe-to-delete
- [ ] 🔴 Quantity control: `−` / `+` buttons cập nhật Room DB real-time
- [ ] 🔴 Price summary: subtotal, tax 8%, shipping fee (≥500k = free), total
- [ ] 🔴 Empty cart state với CTA "Khám phá bowls"
- [ ] 🔴 Cart badge trên Bottom Navigation icon (số lượng items)
- [ ] 🟡 Voucher code input field (preview discount, không validate cuối)
- [ ] 🟡 Swipe-to-delete animation

### 3.3 Voucher Validation

- [ ] 🟡 `VoucherFragment.java/kt` — màn hình xem danh sách vouchers (gọi `GET /api/vouchers/all`)
- [ ] 🟡 Hiển thị voucher card với: code, discount, min order, expiry
- [ ] 🟡 Tap voucher → auto-fill vào cart voucher field
- [ ] 🟡 Call `POST /api/vouchers/validate` khi apply → hiển thị discount amount

### 3.4 Sprint 3 DoD

- [ ] Build Your Own flow 4 steps hoàn chỉnh → add custom bowl vào cart
- [ ] Cart persistence: close app → reopen → cart còn nguyên
- [ ] Swipe-to-delete item khỏi cart
- [ ] Total tính đúng: subtotal + tax + shipping - discount
- [ ] Cart badge cập nhật real-time

---

## SPRINT 4 — Checkout & Order History (Tuần 7–8)
> **Sprint Goal**: End-to-end order flow hoàn chỉnh — đặt hàng + xem lịch sử

### 4.1 Checkout Screen

- [ ] 🔴 `CheckoutFragment.java/kt` + `CheckoutViewModel.kt`
- [ ] 🔴 Delivery info form: Họ tên, Số điện thoại, Địa chỉ giao hàng, Ghi chú
- [ ] 🔴 Saved address: nếu user đã có address trong profile → pre-fill
- [ ] 🔴 Payment method selection: COD / MoMo / Card / Bank Transfer (radio group)
- [ ] 🔴 Order summary: items list, prices breakdown
- [ ] 🔴 Voucher code field với real-time validation (call `POST /api/vouchers/validate`)
- [ ] 🔴 "Đặt hàng" button → call `POST /api/orders` → navigate to Order Confirmation
- [ ] 🔴 Loading state khi đang submit (disable button, show progress)
- [ ] 🔴 Error handling: out-of-stock, invalid voucher, network error
- [ ] 🟡 Form validation: required fields, phone number format
- [ ] 🟡 Địa chỉ dropdown suggestions (manual list các quận/huyện)

### 4.2 Order Confirmation Screen

- [ ] 🔴 `OrderConfirmationFragment.java/kt`
- [ ] 🔴 Lottie success animation
- [ ] 🔴 Order number display (ORD-XXXXX)
- [ ] 🔴 Estimated delivery time
- [ ] 🔴 CTA buttons: "Xem đơn hàng" / "Tiếp tục mua sắm"
- [ ] 🔴 Clear cart sau khi đặt hàng thành công

### 4.3 Order History Screen

- [ ] 🔴 `OrderListFragment.java/kt` + `OrderViewModel.kt`
- [ ] 🔴 `OrderRepositoryImpl.java`: gọi `GET /api/orders` + cache Room
- [ ] 🔴 Order list RecyclerView: card hiển thị order number, date, status, total
- [ ] 🔴 Status badge với màu sắc: pending(gray) → confirmed(blue) → preparing(orange) → delivering(cyan) → completed(green) / cancelled(red)
- [ ] 🟡 Filter theo status: tabs All / Active / Completed / Cancelled
- [ ] 🟡 Pagination: load more khi scroll xuống cuối (infinite scroll)
- [ ] 🟡 Pull-to-refresh

### 4.4 Order Detail Screen

- [ ] 🔴 `OrderDetailFragment.java/kt`
- [ ] 🔴 Order status timeline: 5 bước visual (stepper view)
- [ ] 🔴 Items list với ảnh, tên, số lượng, giá
- [ ] 🔴 Delivery info card
- [ ] 🔴 Payment info card
- [ ] 🔴 "Hủy đơn" button (chỉ hiện khi status = pending) → call `PATCH /api/orders/:id/cancel`
- [ ] 🔴 "Đặt lại" button → pre-fill cart với các items này

### 4.5 GAP Fixes cho Sprint 4

- [ ] 🔴 **GAP-07**: Confirm backend cancel order trả đủ data
- [ ] 🔴 **GAP-08**: Implement pagination trong `GET /api/orders`
- [ ] 🔴 **GAP-10**: Verify `GET /api/vouchers/all` hoạt động

### 4.6 Sprint 4 DoD — End-to-End Milestone

- [ ] Login → Browse → Add to Cart → Checkout → Place Order → thấy Order trong History
- [ ] Order status timeline hiển thị đúng
- [ ] Hủy đơn pending thành công
- [ ] Form validation cho checkout fields
- [ ] Unit test: `CreateOrderUseCase`, `OrderRepositoryImpl`
- [ ] **Demo cho giảng viên** (nếu có mid-term checkpoint)

---

## SPRINT 5 — Supplementary Screens & Advanced Features (Tuần 9–10)
> **Sprint Goal**: Hoàn thiện app — Chat, Stores, FAQs + Advanced mobile features

### 5.1 Chatbot Screen

- [ ] 🔴 `ChatFragment.java/kt` + `ChatViewModel.kt`
- [ ] 🔴 `ChatRepositoryImpl.java`: gọi `POST /api/chat`
- [ ] 🔴 Chat bubble RecyclerView: user bubbles (right) + bot bubbles (left)
- [ ] 🔴 Input bar + Send button
- [ ] 🔴 Typing indicator animation (3 dots)
- [ ] 🔴 Chat history persistence trong Room DB (show lại khi reopen)
- [ ] 🔴 FAB trên tất cả màn hình chính → navigate to Chat
- [ ] 🟡 Quick reply suggestion chips (từ API response `suggestions[]`)
- [ ] 🟡 Markdown-lite formatting: **bold**, bullet points
- [ ] 🟡 "Đặt ngay" action button trong chat response (nếu response có `action: redirect_build_your_own`)

### 5.2 Stores Screen

- [ ] 🔴 `StoresFragment.java/kt`
- [ ] 🔴 Static store data (list hardcoded từ data) — không cần API mới
- [ ] 🔴 Store list: tên, địa chỉ, giờ mở cửa, số điện thoại
- [ ] 🟡 Map placeholder (ImageView với map screenshot) — tránh Google Maps billing
- [ ] 🟢 Intent: tap "Chỉ đường" → mở Google Maps với địa chỉ (không cần SDK)

### 5.3 FAQs Screen

- [ ] 🔴 `FaqsFragment.java/kt`
- [ ] 🔴 ExpandableListView hoặc RecyclerView với expand/collapse animation
- [ ] 🔴 Static FAQ data (hardcode từ Angular FAQ page)

### 5.4 About Us & Profile Screens

- [ ] 🔴 `AboutFragment.java/kt`: team info, brand story (static content)
- [ ] 🔴 `ProfileFragment.java/kt`:
  - Hiển thị user info (username, email, fullName, phone)
  - Edit profile → call `PATCH /api/auth/profile`
  - Logout button → clear token → navigate Login
  - Order history quick link
- [ ] 🟡 Change password dialog → call `PATCH /api/auth/change-password`

### 5.5 Advanced Mobile Features

- [ ] 🟡 **Biometric Login**: `BiometricPrompt` — lưu credentials + prompt fingerprint/face
- [ ] 🟡 **Push Notifications (FCM)**:
  - Thêm `google-services.json` vào project
  - Setup `FirebaseMessagingService`
  - Gọi `POST /api/devices/register` khi login (GAP-09)
  - Handle notification payload → navigate đúng screen
  - Show notification khi app background
- [ ] 🟡 **Deep Links**: `AndroidManifest.xml` intent filters cho `eatomo://bowl/{id}` và `eatomo://order/{id}`
- [ ] 🟡 **Offline mode improvements**: hiển thị banner "Đang offline — dữ liệu có thể cũ"

### 5.6 GAP Fixes cho Sprint 5

- [ ] 🟡 **GAP-09**: Backend FCM integration (`firebase-admin`, `Device model`, notification trigger)
- [ ] 🟡 **GAP-13**: Backend refresh token (optional)
- [ ] 🟢 **GAP-15**: Backend avatar upload (optional)

### 5.7 Sprint 5 DoD

- [ ] Chat với bot nhận được response, suggestion chips hoạt động
- [ ] Profile edit saved và reflected ngay trên UI
- [ ] Biometric login prompt xuất hiện khi setting được bật
- [ ] App không crash khi toggle airplane mode

---

## SPRINT 6 — AI Visual Bowl Recognition (Tuần 11–12)
> **Sprint Goal**: Feature AI food scanning hoạt động với gallery images

### 6.1 ML Model Preparation (Parallel track — bắt đầu từ Sprint 4)

- [ ] 🔴 Download Food-101 dataset từ Kaggle
- [ ] 🔴 Download 30VNFoods dataset
- [ ] 🔴 Setup Google Colab notebook với TFLite Model Maker
- [ ] 🔴 Run training script:
  ```python
  from tflite_model_maker import image_classifier
  data = image_classifier.DataLoader.from_folder('dataset/')
  model = image_classifier.create(data, model_spec='mobilenet_v2', epochs=10)
  model.export(export_dir='./', tflite_filename='food_classifier.tflite')
  ```
- [ ] 🔴 Export `food_classifier.tflite` (~3.4 MB) + `labels.txt`
- [ ] 🟡 Evaluate model: print top-1 accuracy, test với 20 ảnh mẫu
- [ ] 🟡 Fine-tune nếu accuracy < 70%

### 6.2 CameraX + Gallery Integration

- [ ] 🔴 Thêm CameraX dependencies: `camera-camera2`, `camera-lifecycle`, `camera-view`
- [ ] 🔴 Request permissions: `CAMERA`, `READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES`
- [ ] 🔴 `FoodScanFragment.java/kt`:
  - Camera preview với CameraX `PreviewView`
  - Capture button → save Bitmap
  - Gallery picker button → `ActivityResultContracts.GetContent()`
- [ ] 🔴 Handle permission denied → show rationale dialog

### 6.3 TFLite Integration

- [ ] 🔴 Copy `food_classifier.tflite` + `labels.txt` vào `assets/`
- [ ] 🔴 Thêm dependency: `org.tensorflow:tensorflow-lite-task-vision`
- [ ] 🔴 `ImagePreprocessor.java`:
  - Resize Bitmap → 224×224
  - Create `TensorImage` + normalize [0,1]
- [ ] 🔴 `FoodClassifier.java`:
  - Load model từ assets: `ImageClassifier.createFromFile(context, "food_classifier.tflite")`
  - `classify(TensorImage)` → trả `List<Classifications>`
  - Lấy top-3 results với confidence score
- [ ] 🔴 **ML Kit Gate (Stage 1)**: trước khi classify, dùng ML Kit Image Labeling kiểm tra có phải food không (confidence > 0.6)

### 6.4 Nutrition & Comparison Engine

- [ ] 🔴 `NutritionLookup.java`: Map 30+ ingredients → NutritionInfo (calo/protein/carbs/fat per 100g)
- [ ] 🔴 `NutritionEstimate.java`: POJO kết quả ước tính
- [ ] 🔴 `BowlComparisonEngine.java`:
  - Input: NutritionEstimate + List<Bowl> từ Room
  - Output: top 3 bowls healthier (ít calo hơn, nhiều protein hơn)
  - Calculate: caloriesSaved, proteinGained
- [ ] 🔴 `FoodRecognitionUseCase.java`: preprocess → classify → lookup nutrition
- [ ] 🔴 `CompareWithEatomoUseCase.java`: nutrition → compare with cached bowls

### 6.5 Scan Result Screen

- [ ] 🔴 `FoodScanResultFragment.java/kt`:
  - Hiển thị ảnh đã chụp với detected labels + confidence %
  - Nutrition estimate card (Calo / Protein / Carbs / Fat)
  - Top 3 Eatomo bowl recommendations với comparison (⬇️ X calo, ⬆️ Yg protein)
  - "Đặt ngay" button → add recommended bowl vào cart
  - "Chụp lại" button
  - Disclaimer text: "Ước tính tham khảo ±15-20%"
- [ ] 🔴 `FoodScanViewModel.kt`: LiveData<ScanState> với states: Idle → Scanning → Success → Error

### 6.6 Navigation Integration

- [ ] 🔴 Thêm Food Scanner vào nav_graph: `scanFragment`, `scanResultFragment`
- [ ] 🔴 Entry point: Bottom nav tab "Scan" hoặc FAB trên Home/BowlList
- [ ] 🟡 Lottie animation khi đang "phân tích" (processing state)

### 6.7 Sprint 6 DoD

- [ ] Chọn ảnh từ Gallery (emulator) → app phân tích → hiển thị detected items
- [ ] Nutrition estimate card hiển thị số liệu (dù chỉ approximate)
- [ ] Ít nhất 1 Eatomo bowl được recommend dựa trên kết quả scan
- [ ] "Đặt ngay" → add bowl vào cart hoạt động
- [ ] Model accuracy ≥ 70% trên test set ảnh mẫu
- [ ] App không crash khi scan ảnh không phải food

---

## SPRINT 7 — Polish, Testing & Demo Prep (Tuần 13–14)
> **Sprint Goal**: App ổn định, đẹp, test coverage đủ, sẵn sàng demo

### 7.1 UI Polish

- [ ] 🔴 Review tất cả screens: padding, margin, typography nhất quán (8dp grid)
- [ ] 🔴 Dark mode support (Material 3 auto + custom colors)
- [ ] 🔴 Transition animations giữa các screens (shared element transitions cho Bowl Detail)
- [ ] 🟡 Lottie animations cho: order success, empty states, loading
- [ ] 🟡 Skeleton loading cho tất cả list screens (Home, BowlList, OrderList)
- [ ] 🟡 Haptic feedback cho: add to cart, order placed, biometric success
- [ ] 🟡 Pull-to-refresh animations nhất quán

### 7.2 Error States & Edge Cases

- [ ] 🔴 No internet screen với retry button (tất cả screens)
- [ ] 🔴 Empty state screens: Empty Cart, No Orders, No Search Results
- [ ] 🔴 API timeout handling (OkHttp 30s timeout)
- [ ] 🔴 Token expired flow: auto redirect to Login với message "Phiên đăng nhập hết hạn"
- [ ] 🔴 Server error (5xx) user-friendly message
- [ ] 🟡 Image load failure placeholder (Glide error drawable)
- [ ] 🟡 Form validation messages rõ ràng (không dùng Toast, dùng TextInputLayout error)

### 7.3 Testing

- [ ] 🔴 Unit Tests (target >60% coverage):
  - `LoginUseCaseTest`
  - `BowlRepositoryImplTest` (với MockWebServer)
  - `CartRepositoryImplTest` (với in-memory Room)
  - `OrderRepositoryImplTest`
  - `FoodClassifierTest` (với sample images)
  - `BowlComparisonEngineTest`
  - `NutritionLookupTest`
- [ ] 🔴 UI Tests (Espresso — critical flows):
  - Login flow test
  - Browse bowls → add to cart test
  - Checkout form validation test
- [ ] 🟡 Integration test: full login → order flow với MockWebServer
- [ ] 🟡 Run `./gradlew test` và `./gradlew lint` — zero errors
- [ ] 🟢 Firebase Test Lab nếu có access

### 7.4 Performance

- [ ] 🔴 Android Profiler: check memory leaks (không có MemoryLeak warning)
- [ ] 🔴 App startup time < 2 giây trên mid-range emulator
- [ ] 🟡 RecyclerView smooth scroll: không drop frames (60fps) trên BowlList
- [ ] 🟡 Image caching: verify Glide disk cache hoạt động
- [ ] 🟡 ProGuard/R8: build release APK và test không crash

### 7.5 Documentation

- [ ] 🔴 `README.md` cho Android repo:
  - Setup instructions (clone, run, configure)
  - Architecture overview diagram
  - API endpoints sử dụng
  - AI feature description
  - Screenshots
- [ ] 🟡 Code comments cho complex logic (NutritionLookup, BowlComparisonEngine)
- [ ] 🟡 Javadoc cho public APIs của repositories và use cases

### 7.6 Demo Preparation

- [ ] 🔴 Chuẩn bị demo script (5–7 phút):
  1. Launch app → Splash
  2. Register/Login
  3. Home screen → scroll featured bowls
  4. Browse bowls → filter category → view detail
  5. Add to cart → Build Your Own
  6. Checkout → place order
  7. Order history → order detail + status timeline
  8. Chat với bot (ví dụ nutrition coaching)
  9. **AI Feature**: chọn ảnh từ gallery → phân tích → recommendation
  10. Profile screen
- [ ] 🔴 Seed database với đủ data: 50 bowls, 5–10 orders mẫu
- [ ] 🔴 Test demo script end-to-end ít nhất 3 lần trên emulator API 34
- [ ] 🟡 Record demo video (5 phút) làm backup
- [ ] 🟡 Chuẩn bị slide thuyết minh (Architecture, AI pipeline, Scrum process)
- [ ] 🟢 APK release build để cài thử trên Android phone thật (nếu có)

### 7.7 Final Sprint DoD

- [ ] Tất cả Must user stories (US-001→US-055 must) đã Done
- [ ] `./gradlew test` pass 100%
- [ ] `./gradlew lint` 0 errors
- [ ] App không crash trong demo script 3 lần liên tiếp
- [ ] README hoàn chỉnh
- [ ] All PRs merged vào `main`

---

## 📊 PHẦN 3 — TRACKING TỔNG QUAN

### Sprint velocity target

| Sprint | Tuần | Goal | Story Points |
|--------|------|------|-------------|
| Sprint 0 | T0 | Chuẩn bị | N/A |
| Sprint 1 | T1–T2 | Foundation + Auth | 30 pts |
| Sprint 2 | T3–T4 | Home + Bowls | 28 pts |
| Sprint 3 | T5–T6 | BYO + Cart | 32 pts |
| Sprint 4 | T7–T8 | Checkout + Orders | 35 pts |
| Sprint 5 | T9–T10 | Advanced features | 28 pts |
| Sprint 6 | T11–T12 | AI Feature | 30 pts |
| Sprint 7 | T13–T14 | Polish + Testing | 25 pts |

### Milestones chính

```
📍 Cuối Sprint 0:  Backend gaps đã fix, emulator chạy được
📍 Cuối Sprint 2:  Login + Browse bowls demo được
📍 Cuối Sprint 4:  END-TO-END order flow — milestone chính ✅
📍 Cuối Sprint 6:  AI feature demo được
📍 Cuối Sprint 7:  DEMO-READY 🎉
```

### Phân công thành viên (gợi ý)

| Task Domain | Người phụ trách | Backup |
|-------------|----------------|--------|
| Architecture + Data layer (Java) | A (Lead Dev) | B |
| UI/UX + Presentation layer (Kotlin) | B | C |
| API Integration + Testing | C | A |
| Feature Development | D | B |
| QA + AI Feature + TFLite | E | D |
| Backend fixes (GAPs) | A + C | — |

---

*Document tổng hợp từ: ANDROID_APP_PLAN.md + AGILE_SCRUM_PLAN.md + phân tích source code backend*  
*Version: 1.0 | 2026-06-09*
