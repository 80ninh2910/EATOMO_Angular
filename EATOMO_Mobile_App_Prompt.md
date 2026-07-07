# 📱 EATOMO Mobile App — Complete UI/UX Design Prompt

> **Mục đích**: Prompt đầy đủ để thiết kế / code giao diện mobile app EATOMO  
> **Nguồn phân tích**: Angular 19 frontend + UI_PLAN + ANDROID_APP_PLAN + brand identity  
> **Phong cách**: Giữ nguyên DNA thương hiệu EATOMO, adapt sang mobile UX patterns

---

## 🎯 CONTEXT & BRAND DNA

**EATOMO** là ứng dụng thương mại điện tử bán **healthy food bowls** (tô ăn lành mạnh), hướng đến người dùng quan tâm đến dinh dưỡng và lối sống lành mạnh tại Việt Nam.

### Brand Personality
- **Tagline**: *"Eat Clean, Feel Green"*
- **Tone**: Thân thiện, tươi trẻ, khoa học nhưng không khô khan
- **Positioning**: Healthy nhưng không boring — vui tươi, đầy màu sắc, accessible với giới trẻ Việt

---

## 🎨 DESIGN SYSTEM — BRAND TOKENS

### Color Palette (giữ nguyên từ web)
```
Primary Green:    #32CD32  (Lime Green — màu chủ đạo)
Primary Dark:     #228B22  (Forest Green — hover, active states)
Secondary:        #FF4500  (Burnt Orange/Red — CTA, badges)
Accent:           #FFD700  (Bright Yellow — highlight, star ratings)
Pastel Blue:      #AEC6CF  (Info states, vegetarian category)
Background:       #F4F4F9  (Off-white warm)
Card Surface:     #FFFFFF
Text Primary:     #1A1A1A
Text Muted:       #666666
Success:          #22C55E
Error:            #EF4444
```

### Typography
- **Display Font**: `Fredoka` (Google Fonts) — tròn, thân thiện, dễ đọc
- **Body Font**: `Quicksand` hoặc `Fredoka` — clean, modern
- **Font Scale (Mobile)**:
  ```
  Hero/Display:   32-40px, weight 700
  Section Title:  22-28px, weight 600
  Card Title:     18-20px, weight 600
  Body:           14-16px, weight 400
  Caption:        12px, weight 400
  Label/Badge:    10-12px, weight 700, uppercase, letter-spacing: 1px
  ```

### Shadow System (Y2K Retro-Pop — signature của EATOMO)
```
Shadow SM:   4px 4px 0px rgba(0,0,0,1)   — cards nhỏ
Shadow MD:   8px 8px 0px rgba(0,0,0,1)   — cards chính
Shadow LG:   12px 12px 0px rgba(0,0,0,1) — modals, FAB
```
> ⚠️ **CRITICAL**: Harsh black shadow là DNA thẩm mỹ của EATOMO. KHÔNG dùng soft blur shadows.

### Border Radius
```
Small:  8px   — tags, badges
Medium: 16px  — cards, inputs
Large:  30px  — buttons, pills, chips
```

### Art Direction
- **Phong cách**: Retro-Pop, Y2K aesthetic + modern minimalist
- **Illustrations**: Chunky, bold outlines
- **Icons**: Rounded, filled (Font Awesome style)
- **Animations**: Smooth, playful — 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)
- **Micro-interactions**: Bounce on tap, pulse on add-to-cart, slide transitions

---

## 📐 MOBILE LAYOUT SYSTEM

### Screen Dimensions (design target)
- **Base**: 390×844px (iPhone 14 / Samsung S23)
- **Safe areas**: Respect notch + bottom home indicator
- **Breakpoint**: Support up to 430px width

### Spacing Scale
```
4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px
```

### Navigation Pattern
- **Bottom Tab Bar** (5 tabs): Home | Menu | Build Bowl | Cart | Profile
- **Top App Bar**: Logo (left) + Search (center/right) + Notifications (right)
- **Back Navigation**: iOS-style swipe gesture + back arrow

---

## 📱 SCREENS — ĐẦY ĐỦ DANH SÁCH

### 1. SPLASH SCREEN
```
Layout:
- Full-screen background: gradient xanh lá (#32CD32 → #228B22)
- Center: Logo EATOMO (text display font, white, size 48px)
- Tagline: "Eat Clean, Feel Green" (white, size 16px)
- Loading indicator: animated leaf spinner
- Duration: 2s → auto navigate to Onboarding hoặc Home
```

---

### 2. ONBOARDING (3 slides)
```
Slide 1 — "Fresh Bowls, Made for You"
  - Hero illustration: bowl overflowing with colorful ingredients
  - Title (Fredoka, 28px, dark green)
  - Subtitle (14px, muted)
  - Progress dots

Slide 2 — "Build Your Perfect Bowl"
  - Animation: 4 ingredients flying into bowl
  - Highlight 4 steps: Protein → Carbs → Side → Sauce

Slide 3 — "Track Your Nutrition Effortlessly"
  - Show macro ring chart animated
  - "Calories, Protein, Carbs, Fat — we track it all"

CTA: "Get Started" button (full-width, lime green, shadow MD)
Skip button: top right
```

---

### 3. HOME SCREEN (`HomeFragment`)
```
TOP SECTION:
  - Greeting: "Good morning, [Name]! 🌿"
  - Subtitle: "What are you eating today?"
  - Search bar (tappable → navigate to Search)
  - Notification bell icon

HERO BANNER (ViewPager2 / carousel):
  - 3 slides: seasonal bowl promos
  - Auto-scroll 3s, dot indicators
  - Overlay gradient + promo text + CTA button

CATEGORY CHIPS (horizontal scroll):
  [ ALL ] [ Low-Cal ] [ Balanced ] [ High-Protein ] [ Vegetarian ]
  Style: Pill shape, border 2px solid #1A1A1A, shadow SM on active

FEATURED BOWLS (horizontal RecyclerView):
  Title: "🔥 Today's Picks"
  Bowl Card (compact):
    - Square image (120×120) rounded 16px + shadow
    - Bowl name (16px, bold)
    - Calorie badge (red pill, top-left overlay)
    - Price (green, bold)
    - "+ Add" button (green circle, right corner)

HOW TO BUILD (3-step mini cards):
  Title: "Build Your Own Bowl"
  Subtitle: "4 easy steps, endless combinations"
  Horizontal scroll cards for: Protein → Carbs → Side → Sauce
  CTA: "Start Building" → navigate to BuildYourOwn

OUR STORY SNIPPET:
  - Mini card with team photo
  - "Since 2020, crafting bowls with love"
  - "Learn More" link

CUSTOMER REVIEWS (horizontal scroll cards):
  - Star rating (gold stars)
  - Review excerpt (2-3 lines)
  - Customer name
```

---

### 4. OUR BOWLS / MENU SCREEN (`BowlListFragment`)
```
HEADER:
  - Title: "Our Bowls" (28px Fredoka)
  - Subtitle: "[count] bowls available"

FILTER BAR (sticky on scroll):
  Category tabs: All | Low-Cal | Balanced | High-Protein | Vegetarian
  Search bar (expandable)
  Sort button: Calories ↑↓ | Price ↑↓ | Name

BOWL LIST (Grid 2 columns OR List toggle):
  Bowl Card:
    ┌─────────────────────────────┐
    │  [Bowl Image — 16:9 ratio]  │
    │  🏷️ 274 CALORIES           │ ← Red badge overlay
    │─────────────────────────────│
    │  Salmon Power Bowl          │ ← 18px bold
    │  Grilled salmon, brown rice │ ← 13px muted, 2 lines max
    │  ┌──────┬──────┬──────┐    │
    │  │ 32g  │ 45g  │ 8g   │    │ ← Macro chips
    │  │PROT  │CARBS │ FAT  │    │
    │  └──────┴──────┴──────┘    │
    │  ₫169,900        [+ Add]   │ ← Price + Add button
    └─────────────────────────────┘
  Shadow: 4px 4px 0px black (Y2K style)
  
LOADING STATE: Skeleton shimmer cards
EMPTY STATE: Illustration + "No bowls found. Try another filter"
ERROR STATE: Retry button + error illustration
```

---

### 5. BOWL DETAIL SCREEN (`BowlDetailFragment`)
```
HERO IMAGE (full-width, 60% screen height):
  - Parallax scroll effect
  - Floating back arrow (top-left)
  - Share icon (top-right)

STICKY BOTTOM: Price + Add to Cart

CONTENT (scrollable):
  Category badge (colored pill: e.g., "HIGH PROTEIN" in red)
  Bowl Name (24px, Fredoka, bold)
  Description (14px, muted, expandable)
  
  NUTRITION RING CHART (donut chart):
    Center: Total Calories (large number)
    Segments: Protein (red) | Carbs (yellow) | Fat (blue)
    Legend below chart
  
  MACRO BREAKDOWN CARDS (horizontal):
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  32g     │  │  45g     │  │  8g      │
    │ PROTEIN  │  │  CARBS   │  │   FAT    │
    └──────────┘  └──────────┘  └──────────┘
  
  INGREDIENTS LIST (collapsible section)
  
  QUANTITY SELECTOR: [ − ]  2  [ + ]
  
  SIMILAR BOWLS (horizontal scroll)
  
BOTTOM ACTION BAR (fixed):
  [ ₫169,900 ]  [ 🛒 Add to Cart ]
```

---

### 6. BUILD YOUR OWN (`BuildYourOwnFragment`)
```
SCREEN LAYOUT: Vertical stepper / wizard

PROGRESS INDICATOR (top):
  Step 1: Protein  ●───○───○───○
  Step 2: Carbs    ●───●───○───○
  Step 3: Side     ●───●───●───○  
  Step 4: Sauce    ●───●───●───●

LIVE CALORIE COUNTER (sticky top bar):
  ┌─────────────────────────────────┐
  │  ⚡ 0 / ~450 kcal               │
  │  [████░░░░░░░░░░░░] 0%          │
  └─────────────────────────────────┘
  Updates real-time on every selection

STEP VIEW (fullscreen per step):
  Title: "Step 1: Choose Your Protein"
  Description: "Cooked sous-vide for perfect tenderness"
  
  Ingredient Grid (2 columns):
    ┌──────────────┐  ┌──────────────┐
    │  [Image]     │  │  [Image]     │
    │  Gà nướng   │  │  Cá hồi      │
    │  31g protein │  │  20g protein │
    │  ○ Select    │  │  ○ Select    │
    └──────────────┘  └──────────────┘
  
  Selected card: lime green border + checkmark overlay + shadow
  
  Navigation: Back | Next (disabled until selection made)

SUMMARY SCREEN (Step 5):
  Bowl preview with selected items
  Full nutrition breakdown
  Base price: ₫89,000
  
  [ 🛒 Add Custom Bowl to Cart ]

Toast notification on add: 
  "🎉 Your custom bowl is in the bag!"
```

---

### 7. CART & CHECKOUT (`CartFragment` + `CheckoutFragment`)

#### 7a. Cart Screen
```
HEADER: "My Bag 🛍️" + item count badge

CART ITEMS LIST:
  Each item row:
    ┌─────────────────────────────────────┐
    │ [img] Salmon Bowl          ₫169,900 │
    │       Grilled salmon...             │
    │       [ − ]  1  [ + ]    🗑️         │
    └─────────────────────────────────────┘
  Swipe left to delete
  
VOUCHER INPUT SECTION:
  [ Enter voucher code... ]  [ Apply ]
  Success: green banner "✅ SAVE10 — Giảm 50,000đ"
  Error: red text "❌ Mã không hợp lệ"

ORDER SUMMARY CARD:
  Subtotal:         ₫339,800
  Tax (8%):         ₫27,184
  Shipping:         ₫30,000
  Discount:         -₫50,000  (green)
  ─────────────────────────────
  Total:            ₫346,984  (bold, 20px)

BOTTOM BAR (fixed):
  [ Proceed to Checkout → ]

EMPTY STATE:
  🛒 illustration + "Your bag is empty"
  "Browse our bowls" → CTA button
```

#### 7b. Checkout Screen
```
SECTION 1 — DELIVERY INFO:
  Full name input
  Phone number input (with flag picker)
  Delivery address (Google Places autocomplete)
  Delivery notes (optional, multiline)

SECTION 2 — PAYMENT METHOD:
  Radio cards:
    [💵] Cash on Delivery (COD)
    [💳] Credit/Debit Card
    [🏦] Bank Transfer  
    [📱] MoMo
    [📱] ZaloPay
  
  Selected card: lime green border + checkmark

SECTION 3 — ORDER REVIEW (mini):
  Collapsed summary, expandable

PLACE ORDER BUTTON (full-width, lime green):
  Normal: "Place Order 🎉"
  Loading: spinner + "Processing..."
  
SUCCESS STATE (full screen overlay):
  ✅ green checkmark animation
  "Order Placed Successfully!"
  "Order #ORD-2025-XXXX"
  "We'll prepare your bowl right away!"
  [ Track Order ] [ Continue Shopping ]
  
ERROR STATE: 
  Red banner at top + specific error message
```

---

### 8. ORDER HISTORY & TRACKING (`OrderListFragment` + `OrderDetailFragment`)

#### 8a. Order List
```
TABS: 
  [ Active Orders ] [ Past Orders ]

ORDER CARD:
  ┌─────────────────────────────────────┐
  │  #ORD-2025-0042     09/06/2025      │
  │  Salmon Bowl × 1                    │
  │  Chicken Teriyaki × 2               │
  │                                     │
  │  Total: ₫509,700    [🔵 PREPARING]  │
  └─────────────────────────────────────┘
  Status badge colors:
    pending → gray
    confirmed → blue  
    preparing → orange
    delivering → purple
    completed → green
    cancelled → red
  
  Tap → OrderDetailFragment
  Long press → Reorder option
```

#### 8b. Order Detail / Tracking
```
ORDER NUMBER & DATE (header)

STATUS TIMELINE (vertical stepper):
  ✅ Order Confirmed — 10:30
  ✅ Preparing        — 10:35
  ⏳ Out for Delivery — (pending)
  ○  Delivered

MAP VIEW (if delivering status):
  Mini Google Maps snippet
  "Estimated arrival: 15 minutes"

ORDER ITEMS (expandable list)

DELIVERY ADDRESS & PAYMENT info

ACTIONS:
  [ 📞 Call Support ] [ 🔄 Reorder ]
  [ ❌ Cancel Order ] (only if pending/confirmed)
```

---

### 9. CHAT / AI NUTRITION COACH (`ChatFragment`)
```
FLOATING ACTION BUTTON: 💬 green circle, bottom-right
  → Opens as Bottom Sheet (60% screen height, draggable to full)

CHAT HEADER:
  Avatar: 🤖 Eatomo Bot
  "AI Nutrition Coach"
  Status: "Online"

CHAT AREA:
  Bot message bubble: white + border, left-aligned
  User message bubble: lime green, right-aligned
  Timestamp below each message
  Typing indicator: ... animated dots

QUICK REPLY CHIPS (below input):
  "Tính BMI" | "Gợi ý bowl" | "TDEE của tôi" | "Giờ mở cửa"

INPUT BAR:
  Text input + Send button (green)
  
SAMPLE BOT RESPONSES:
  BMI Card: animated card with BMI value + range gauge
  Bowl Recommendation: mini bowl card with "Đặt ngay" button
  Calorie Goal: circular progress ring
```

---

### 10. STORES MAP (`StoresFragment`)
```
FULL-SCREEN GOOGLE MAPS:
  Custom marker pins (green, EATOMO branded)
  User location pin

BOTTOM SHEET (collapsible list):
  Draggable handle at top
  Store cards:
    - Store name (bold)
    - Address
    - Distance (GPS calculated)
    - Hours: Open / Closed badge
    - [ 📍 Directions ] button (Google Maps intent)
    - [ 📞 Call ] button
  
  Nearest store highlighted at top
  Search bar to filter stores
```

---

### 11. PROFILE SCREEN (`ProfileFragment`)
```
HEADER SECTION:
  Avatar (circle, 80px) — tap to upload photo
  Name (20px bold)
  Email
  "Member since [year]" badge

STATS ROW:
  ┌──────────┬──────────┬──────────┐
  │    12    │  ₫2.3M   │  Level 3 │
  │  Orders  │  Spent   │  Member  │
  └──────────┴──────────┴──────────┘

MENU ITEMS (with right arrow):
  [👤] Edit Profile
  [📦] Order History
  [🎫] My Vouchers
  [📍] Saved Addresses
  [🔔] Notifications Settings
  [❓] FAQs
  [📋] About Us
  [🔒] Privacy & Security
  [🚪] Sign Out (red text)

SETTINGS:
  Language: 🇻🇳 Vietnamese | 🇺🇸 English
  Dark mode toggle
```

---

### 12. LOGIN / REGISTER SCREENS
```
LOGIN:
  Logo (center, large)
  "Welcome back 👋"
  
  Email/Username input (rounded, 2px border)
  Password input (with show/hide toggle)
  "Forgot password?" link (right aligned)
  
  [ Login ] button (full-width, lime green, shadow MD)
  Loading state: spinner inside button, disabled
  
  Divider: ─── or ───
  [ Continue with Google ] (outline button)
  [ Continue with Biometric 🔐 ] (if supported)
  
  "Don't have an account? Sign up" link
  Error: red banner at top with specific message

REGISTER:
  "Create account 🌿"
  
  Username input
  Email input
  Password input (strength indicator)
  Confirm password
  
  Terms checkbox: "I agree to Terms of Service"
  
  [ Create Account ] button
  Loading state + success animation
```

---

### 13. FAQs SCREEN (`FaqsFragment`)
```
Search bar at top

Accordion list:
  ┌─────────────────────────────────────┐
  │  Làm thế nào để đặt hàng?       ▼  │
  └─────────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │  Phí giao hàng như thế nào?      ▼  │
  └─────────────────────────────────────┘

Expanded:
  ┌─────────────────────────────────────┐
  │  Phí giao hàng như thế nào?      ▲  │
  │                                     │
  │  Miễn phí ship cho đơn trên        │
  │  500,000đ. Dưới 500k phí 30,000đ. │
  └─────────────────────────────────────┘

Smooth expand/collapse animation (300ms)
```

---

### 14. ABOUT US SCREEN
```
HERO IMAGE (full-width): team photo with parallax
BRAND STORY:
  "Since 2020" badge
  Mission statement
  
VALUES CARDS (3 cards, horizontal scroll):
  🌿 Fresh Daily
  💪 Balanced Macros
  ❤️ Made with Love

TEAM SECTION:
  Horizontal scroll of team member cards

CONTACT:
  Phone, Email, Social links
  Google Maps snippet for HQ
```

---

## 🗂️ NAVIGATION STRUCTURE

```
Bottom Tab Bar (5 tabs):
┌─────┬─────┬──────────┬─────┬─────────┐
│ 🏠  │ 🥣  │    🔨    │ 🛒  │  👤     │
│Home │Menu │Build Bowl│Cart │ Profile │
└─────┴─────┴──────────┴─────┴─────────┘

Cart tab shows badge count (red dot)

Navigation Stack per tab:
  Home:       Home → BowlDetail
  Menu:       BowlList → BowlDetail → (mini cart bottom sheet)
  Build Bowl: Step1 → Step2 → Step3 → Step4 → Summary
  Cart:       Cart → Checkout → OrderSuccess
  Profile:    Profile → EditProfile | OrderHistory | Vouchers | FAQs | AboutUs

Modal/Sheet flows:
  Chat FAB → ChatBottomSheet (any screen)
  Bowl card → BowlDetailBottomSheet (from Home/Menu)
  Notifications icon → NotificationPanel
```

---

## ✨ ANIMATION SPECIFICATIONS

### Screen Transitions
- **Push/Pop**: Shared element transition on bowl image (expand from card)
- **Modal**: Slide up from bottom (spring animation)
- **Tab switch**: Fade cross-dissolve

### Micro-interactions
```
Add to Cart button:
  1. Button scales to 0.9 on press
  2. Spring back + green pulse ring
  3. Cart icon in tab bar bounces + count badge pops in

Category chip select:
  - Scale 1.05 + shadow appears + color fills

Bowl card hover (press):
  - Shadow shifts from 8px 8px to 4px 4px (press down effect)
  - Lift on release

Calorie counter (Build Your Own):
  - Number animates up/down with counter animation
  - Progress bar width animates smoothly

Order status timeline:
  - Completed steps: pulse green animation
  - Current step: loading spinner / blinking dot

Toast notification:
  - Slides up from bottom
  - Auto-dismiss after 3s with progress bar
  - Dismiss on swipe-up
```

---

## 📊 BUSINESS LOGIC TO DISPLAY

### Bowl Categories (color-coded)
```
Low-Cal:      🔵 Blue badge    (#AEC6CF)  — 274-439 kcal, ₫139,900 - ₫179,900
Balanced:     🟢 Green badge   (#32CD32)  — 434-586 kcal, ₫164,900 - ₫219,900
High-Protein: 🔴 Red badge     (#FF4500)  — 560-720 kcal, ₫219,900 - ₫269,900
Vegetarian:   🟡 Yellow badge  (#FFD700)  — 377-536 kcal, ₫129,900 - ₫149,900
```

### Price Calculation (display in checkout)
```
Subtotal = Σ (price × quantity)
Tax = Subtotal × 8%
Shipping = Subtotal > 500,000 ? FREE : ₫30,000
Discount = voucher value
Total = Subtotal + Tax + Shipping - Discount

Free shipping nudge: "Thêm ₫X để được miễn phí giao hàng!"
```

### Order Status Flow
```
pending → confirmed → preparing → delivering → completed
                                             ↘ cancelled
```

### Build Your Own Base Price
```
Base: ₫89,000
Components: Protein (1) + Carbs (1) + Side (1) + Sauce (1)
Calories calculated real-time from ingredient data
```

---

## 🎯 MOBILE-ONLY FEATURES

### Push Notifications (FCM)
```
Types:
  - Order confirmed: "✅ Đơn #XXXXX đã được xác nhận!"
  - Order delivering: "🛵 Đơn hàng đang trên đường đến bạn!"  
  - Reorder reminder: "🥗 Đã 7 ngày rồi, đặt bowl hôm nay nhé?"
  - Promotion: "🎉 Flash sale 11h-13h — Giảm 20% tất cả bowls!"
```

### AI Food Scanner (Premium Feature)
```
Entry: Camera icon in Home header or dedicated tab
Flow:
  1. Camera preview (CameraX) with food detection overlay
  2. [Capture] or [Gallery] buttons
  3. Loading: "🔍 Đang phân tích..."
  4. Results card:
     - Detected ingredients with confidence %
     - Estimated nutrition (calorie + macros)
     - "Eatomo alternative" — healthier bowl suggestion
     - [🛒 Order this bowl] CTA
  5. Disclaimer: "Ước tính tham khảo"
```

### Biometric Login
```
If device supports fingerprint/Face ID:
  Show biometric button on login screen
  "Đăng nhập bằng vân tay" / "Đăng nhập bằng Face ID"
```

### Location Features
```
- GPS nearest store highlight in Stores tab
- Auto-fill delivery address based on GPS
- "Giao đến đây không?" confirmation card
```

---

## 🚫 DESIGN DON'Ts

1. ❌ KHÔNG dùng soft/blurry shadows (signature là hard black shadow)
2. ❌ KHÔNG dùng system font defaults — phải load Fredoka/Quicksand
3. ❌ KHÔNG dùng generic flat design — cần bold borders + depth
4. ❌ KHÔNG để empty states trắng trơn — cần illustration + copy
5. ❌ KHÔNG bỏ loading states — mọi async action cần skeleton/spinner
6. ❌ KHÔNG dùng màu xám generic — stick với brand palette

---

## ✅ DESIGN MUST-HAVES

1. ✅ Bowl images luôn hiển thị với rounded corners + shadow
2. ✅ Calorie badges luôn overlay trên ảnh bowl (red pill, top-left)
3. ✅ Macro breakdown (Protein/Carbs/Fat) hiển thị trên mọi bowl card
4. ✅ "Add to cart" animation phải có cart badge update
5. ✅ Empty cart state có CTA button rõ ràng
6. ✅ Checkout phải có full order summary trước khi confirm
7. ✅ Toast notifications thay cho alert dialogs
8. ✅ Skeleton loading cho tất cả lists (không để màn hình trắng)
9. ✅ Pull-to-refresh trên mọi list screen
10. ✅ Haptic feedback trên các action quan trọng (add to cart, order placed)

---

## 🛠️ TECHNICAL CONTEXT (for developers)

### Backend API Endpoints
```
Base URL: https://[render-backend].onrender.com

Auth:
  POST /api/auth/register    { username, email, password }
  POST /api/auth/login       { username, password } → { access_token, user }
  GET  /api/auth/profile     [JWT required]

Bowls:
  GET  /api/bowls                     → Bowl[]
  GET  /api/bowls?category=low-cal    → Bowl[] (filtered)
  GET  /api/bowls/:id                 → Bowl

Orders:
  POST /api/orders           [JWT] → create order
  GET  /api/orders           [JWT] → user's orders
  GET  /api/orders/:id       [JWT] → order detail

Chat:
  POST /api/chat             { message } → { response }
```

### Data Models
```typescript
Bowl {
  id: string         // "L1", "B3", "H5"
  name: string
  description: string
  price: number      // VND (e.g. 169900)
  calories: number
  protein: number
  carbs: number
  fat: number
  category: "low-cal" | "balanced" | "high-protein" | "vegetarian"
  image: string      // URL
  inStock: boolean
}

CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  // Custom bowl extras:
  customProteins?: string[]
  customVeggies?: string[]
  customSauces?: string[]
}

Order {
  id: string
  orderNumber: string
  status: "pending" | "confirmed" | "preparing" | "delivering" | "completed" | "cancelled"
  items: OrderItem[]
  subtotal: number
  tax: number
  shippingFee: number
  discountAmount: number
  totalAmount: number
  paymentMethod: "cash" | "momo" | "card" | "bank_transfer"
  deliveryAddress: string
  deliveryPhone: string
  createdAt: Date
}
```

### Android Tech Stack (if building native)
```
Language:      Java (core) + Kotlin (UI/ViewModels)
Architecture:  MVVM + Clean Architecture
DI:            Hilt
Networking:    Retrofit 2 + OkHttp 4 + Gson
Images:        Glide 4
Local DB:      Room (SQLite)
Navigation:    Jetpack Navigation Component
UI:            Material Design 3 (Material You)
Auth Storage:  EncryptedSharedPreferences
Charts:        MPAndroidChart (nutrition rings)
Maps:          Google Maps SDK
Notifications: Firebase Cloud Messaging (FCM)
Camera/ML:     CameraX + ML Kit
```

---

## 📋 SCREEN CHECKLIST

| # | Screen | Priority | Notes |
|---|--------|----------|-------|
| 1 | Splash | 🔴 P0 | Animated logo |
| 2 | Onboarding | 🟡 P2 | 3 slides, skip option |
| 3 | Home | 🔴 P0 | Core discovery screen |
| 4 | Bowl List (Menu) | 🔴 P0 | Filter + Grid/List |
| 5 | Bowl Detail | 🔴 P0 | Nutrition chart |
| 6 | Build Your Own | 🔴 P0 | 4-step wizard |
| 7 | Cart | 🔴 P0 | Voucher + summary |
| 8 | Checkout | 🔴 P0 | Full form + payment |
| 9 | Order Success | 🔴 P0 | Celebration UI |
| 10 | Order History | 🟠 P1 | Active + Past tabs |
| 11 | Order Detail | 🟠 P1 | Status timeline |
| 12 | Login | 🔴 P0 | Biometric option |
| 13 | Register | 🔴 P0 | Form + validation |
| 14 | Profile | 🟠 P1 | Stats + menu |
| 15 | Stores Map | 🟠 P1 | GPS + list |
| 16 | Chat (Bottom Sheet) | 🟠 P1 | FAB entry |
| 17 | FAQs | 🟡 P2 | Accordion |
| 18 | About Us | 🟡 P2 | Brand story |
| 19 | AI Food Scanner | 🟢 P3 | Premium AI feature |
| 20 | Notifications | 🟡 P2 | Push + in-app |

---

*Prompt generated by analysis of EATOMO Angular 19 frontend, UI_PLAN.md, ANDROID_APP_PLAN.md, PROJECT_OVERVIEW.md, and brand identity documents.*  
*Generated: 2026-06-09*
