# EATOMO — Hướng dẫn cài đặt

## Yêu cầu
- [Node.js 18+](https://nodejs.org) · [MongoDB 6+](https://www.mongodb.com/try/download/community)

---

## Các bước chạy

**1. Clone & mở thư mục**
```bash
git clone <repo-url>
cd EATOMO_Angular
```

**2. Cài dependencies**
```bash
cd backend && npm install && cd ..
cd EATOMO  && npm install && cd ..
```

**3. Khởi động MongoDB** *(mở terminal riêng)*
```bash
mongod
```

**4. Seed dữ liệu mẫu**
```bash
# Chạy từ EATOMO_Angular/
node seed.js
```

**5. Chạy Backend** *(terminal 1)*
```bash
cd backend
npm run dev
```
> Chạy tại `http://localhost:3000`

**6. Chạy Frontend** *(terminal 2)*
```bash
cd EATOMO
npm start
```
> Chạy tại `http://localhost:4200`

---

## Tài khoản test

### 👑 Admin
| Username | Password  | URL admin  |
|----------|-----------|------------|
| `admin`  | `admin123`| `http://localhost:4200/admin` |

### 👤 User (test UI mua hàng)
| Username      | Password       | Tên hiển thị         |
|---------------|----------------|----------------------|
| `user`        | `user123`      | Nguyen Van A         |
| `lethib`      | `lethi123`     | Le Thi Be Bu         |
| `tranvanc`    | `tranvan123`   | Tran Van Cun         |
| `phamthid`    | `phamthi123`   | Pham Thi Dep         |
| `hoangvane`   | `hoangvan123`  | Hoang Van E A        |
| `nguyenthif`  | `nguyenthi123` | Nguyen Thi Phi Pheo  |
| `vuvang`      | `vuvan123`     | Vu Van Gay           |
| `buitihhung`  | `buihing123`   | Bui Thi Hung         |
| `dangvanik`   | `dangvan123`   | Dang Van I Oi        |
| `lekimkhoe`   | `lekim123`     | Le Kim Khoe Re       |
| `ngovanluong` | `ngovan123`    | Ngo Van Luong Bong   |
| `phanmymy`    | `phanmy123`    | Phan My My           |
| `truongnon`   | `truong123`    | Truong Van Non Choet |
| `vothioanh`   | `vothi123`     | Vo Thi Oanh Oach     |
| `dohuuphuc`   | `dohuu123`     | Do Huu Phuc Beo      |

---

## Voucher codes để test

| Code           | Ưu đãi                          |
|----------------|---------------------------------|
| `WELCOME10`    | -10% (không cần đơn tối thiểu) |
| `FIRSTORDER30` | -30%, tối đa 120k               |
| `EATOMO50K`    | -50k, đơn từ 300k               |
| `HEALTHY20`    | -20%, đơn từ 200k               |
| `FLASH25`      | -25%, đơn từ 150k               |
| `FREESHIP`     | Miễn ship 25k, đơn từ 100k     |
| `VEGGIE25`     | -25% bowl chay                  |
| `PROTEIN10`    | -10% bowl nhiều đạm             |

---

## Gỡ lỗi nhanh

| Lỗi | Cách xử lý |
|-----|-----------|
| `connect ECONNREFUSED 27017` | Chưa chạy `mongod` |
| `Cannot find module 'mongoose'` | Chạy `cd backend && npm install` |
| Trang trắng / API lỗi | Kiểm tra backend đang chạy port 3000 |
