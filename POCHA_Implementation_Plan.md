# Kế hoạch Chuyển Đổi Thương Hiệu: Từ EATOMO Sang POCHA

Dự án hiện tại là một hệ thống website bán Healthy Food Bowls (EATOMO). Việc chuyển đổi hoàn toàn sang thương hiệu POCHA (Hard Kombucha) đòi hỏi thay đổi sâu rộng về cả nhận diện thương hiệu, giao diện, cấu trúc dữ liệu sản phẩm, và tính năng E-commerce cốt lõi (từ "Build-Your-Own Bowl" thành "Build-Your-Own Box").

## User Review Required
1. **Phong cách CSS/UI**: Để thay đổi từ EATOMO sang Retro-Pop/Y2K, bạn muốn tôi chỉ override các CSS Variables (màu sắc, font chữ) giữ nguyên cấu trúc khung (layout) hiện tại, hay thiết kế lại bố cục các trang từ đầu?
2. **Backend/Dữ liệu mẫu**: Backend hiện tại đang dùng mock data hay API thật? Chúng ta sẽ tiến hành thay đổi toàn bộ mock data trên Frontend Angular (file json/service) trước để website chạy giao diện POCHA, sau đó mới đồng bộ Backend sau, có đúng không?

## Open Questions
1. Trong thư mục `/PoCha`, tôi thấy có các file ảnh như `banner.jpg`, `avapoacha.jpg`, `dâu.png`, `chanh.png`, v.v... File nào sẽ được sử dụng làm logo chính trên Header?
2. Đối với phần Copywriting, bạn đã có sẵn các đoạn text Gen Z cho trang chủ chưa, hay tôi sẽ tự sáng tạo và điền vào các vị trí Hero Banner, About Us?

## Proposed Changes

Dưới đây là các hạng mục dự kiến thay đổi trên Frontend Angular.

### 1. Data Models & Services
Thay thế hoàn toàn khái niệm "Bowl" thành "Kombucha/Product".

#### [MODIFY] `src/app/services/bowl.service.ts` -> (Sẽ đổi tên hoặc logic thành `product.service.ts`)
- Thay thế danh sách 50 bowls thành 4 dòng sản phẩm chính của POCHA và các option combo.
- Cấu trúc model mới: bỏ (calories, protein, carbs, fat) -> thêm (abv: 5%, volume: 330ml, flavor).

#### [MODIFY] `src/app/services/cart.service.ts`
- **Cập nhật Interface `CartItem`**: Thay vì lưu `proteins`, `veggies`, `sauces` (cho tô salad), sẽ cập nhật thành lưu `selectedFlavors` (ví dụ: `['Strawb Smash', 'Citrus Kick', 'Citrus Kick', 'Berry Buzz']`) dùng cho "Build-Your-Own Box" (Mix 4 hoặc Mix 6).

### 2. Branding & Thiết Kế Giao Diện (UI/UX)
Áp dụng phong cách Retro-Pop, Y2K.

#### [MODIFY] `src/styles.css` / Global CSS
- Thay đổi hệ thống bảng màu (CSS Variables) sang: Lime green, Burnt orange/red, Bright yellow, Pastel blue.
- Cập nhật Typography: Import font chữ chunky, bubble vui nhộn.
- Cập nhật button styles, hover effects theo hướng năng động, flash-photography style.

#### [MODIFY] `src/index.html` & Header/Footer
- Cập nhật Title, Meta tags, Favicon.
- **Header**: Thay logo văn bản EATOMO thành POCHA logo.
- **Footer**: Chèn tagline "SIP. CHILL. REPEAT." & "WHERE FLAVOUR MEETS THE PARTY".

### 3. Pages / Layouts

#### [MODIFY] `src/app/home.component.html` & `.ts`
- Đổi Hero section: Sử dụng `banner.jpg` hoặc hình ảnh lifestyle.
- Gắn Copywriting chuẩn Gen Z.
- Thay thế section "Featured Bowls" thành "Meet the Little Fruit Friends": Hiển thị 4 nhân vật mascot tương ứng 4 hương vị (dâu.png, chanh.png, quýt.png, berry.png).

#### [MODIFY] `src/app/pages/our-bowls/` -> (Shop POCHA)
- Thiết kế lại trang danh sách sản phẩm.
- Chia làm 2 tab/categories: 
  - **Single & Fixed Packs**: Chọn mua lẻ hoặc lốc cố định (4/6 lon một vị).
  - **Build-Your-Own**: Link qua trang tự mix.

#### [MODIFY] `src/app/pages/build-your-own/` -> (Build-Your-Own Box)
- Đập đi xây lại luồng đặt hàng.
- **Step 1**: Khách hàng chọn kích cỡ hộp (Lốc 4 lon hoặc 6 lon).
- **Step 2**: Giao diện hiển thị 4 hương vị (kèm nút +/-). Khách hàng bấm chọn từng vị cho đến khi thanh tiến trình (Progress Bar) đầy (vd: đạt 4/4).
- **Step 3**: Nút "Add to Cart" sáng lên, hiển thị giá combo.

## Verification Plan

### Automated Tests
- Kiểm tra tính toàn vẹn của ứng dụng bằng `npm run build` để đảm bảo các thay đổi tên biến (từ bowl sang product) không gây lỗi compile.

### Manual Verification
- Khởi chạy ứng dụng `ng serve`.
- **UI Check**: Review màu sắc, font chữ, hình ảnh Mascot trên Trang chủ và Header/Footer.
- **Flow Check**: Chạy thử luồng người dùng vào trang "Build-Your-Own Box", tick chọn lốc 6 lon, mix lộn xộn 4 vị Kombucha, thêm vào giỏ hàng và sang trang Orders kiểm tra xem đơn hàng hiển thị đúng danh sách hương vị đã mix.
