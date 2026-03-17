# BAO CAO XAY DUNG AI CHATBOT EATOMO

## 1) Tong quan de tai
- Ten de tai: Xay dung tro ly AI chatbot cho he thong EATOMO.
- Muc tieu kinh doanh:
  - Tu van khach hang nhanh, ro, dung ngu canh.
  - Giam tai cho CSKH thu cong.
  - Tang ti le chuyen doi qua goi y mon va dieu huong trang.
- Pham vi he thong:
  - Tu van don hang, voucher, dinh duong, cua hang.
  - Fallback chuyen nghiep den kenh ho tro khi cau hoi vuot pham vi.

## 2) Bai toan va yeu cau
### 2.1 Bai toan
- Khach hang dat cau hoi da dang, co the mo ho, viet khong dau, hoac thieu du lieu.
- Bot can tra loi ngan gon, dung trong tam, va khong tra loi lan man.

### 2.2 Yeu cau chuc nang
- Nhan dien intent tu tin nhan nguoi dung.
- Hoi lai thong minh khi do tin cay thap.
- Tu van dinh duong va goi y bowl theo muc tieu.
- Fallback CSKH chuan: hotline, email, gio ho tro, link lien he.
- Nho thong tin theo phien chat (muc tieu, khau vi, ngan sach, khu vuc).
- Do luong analytics chatbot de toi uu lien tuc.

### 2.3 Yeu cau phi chuc nang
- Phan hoi nhanh, on dinh.
- Tone thuong hieu dong nhat.
- An toan thong tin, khong ro ri du lieu noi bo.

## 3) Phuong phap tiep can
### 3.1 Kien truc hybrid Rule-based + LLM
- Tang 1 (Rule-based):
  - Regex va rule de xu ly cac nghiep vu chac chan (don hang, voucher, FAQ).
- Tang 2 (LLM support):
  - Xu ly cau hoi mo rong/off-topic theo phong cach ngan gon, huong hanh dong.
- Tang 3 (Business action):
  - Tra ve action de frontend dieu huong trang (stores, about-us, build-your-own).

### 3.2 Quy trinh xu ly hoi dap
1. Tien xu ly van ban (normalize, bo dau de nhan dien khong dau/co dau).
2. Cham diem intent va tinh do tin cay.
3. Neu mo ho hoac confidence thap: dat 1 cau hoi lam ro.
4. Neu intent ro: xu ly theo module nghiep vu.
5. Neu vuot pham vi: fallback CSKH chuyen nghiep.
6. Ghi nhan analytics cho moi request.

### 3.3 Session memory
- Trich thong tin tu history hien tai:
  - Muc tieu (giam can/tang co/giu dang)
  - Rang buoc an uong (vi du: khong an bo)
  - Ngan sach
  - Khu vuc
- Ap dung memory vao cau tra loi va bo loc goi y mon.

## 4) Cong nghe su dung
- Frontend: Angular (standalone components, signal state, router).
- Backend: Node.js + Express.
- Database: MongoDB (Order, Voucher, Bowl, User...).
- AI service: OpenAI Chat Completions (fallback/off-topic co kiem soat).
- Logging/Analytics: In-memory analytics endpoint (co the nang cap len Redis/DB).

## 5) Thiet ke module chinh
### 5.1 Intent Detection va Confidence
- Rule detect intent theo tu khoa/regex.
- He thong score cho nhieu intent dong thoi.
- Tinh confidence tu top score / tong score.
- Danh dau ambiguous neu 2 intent top gan nhau.

### 5.2 Clarifying Question (hoi lai thong minh)
- Dieu kien kich hoat:
  - Intent fallback
  - Ambiguous = true
  - Confidence < nguong
- Nguyen tac:
  - Chi hoi 1 cau lam ro.
  - Dua 2-4 lua chon nhanh (suggestions).

### 5.3 Fallback CSKH
- Khi khong du pham vi, bot phai:
  - Xin loi lich su
  - Neu ro huong xu ly thi noi ro
  - Kem hotline, email, gio ho tro, link lien he

### 5.4 Brand Tone
- Mau cau thong nhat:
  - Lich su
  - Ngan gon
  - Ro hanh dong tiep theo
- Tranh:
  - Van phong dai dong
  - Tra loi chung chung, khong co huong dan

### 5.5 Analytics Chatbot
- Chi so can do:
  - totalRequests
  - fallbackCount
  - clarifyCount
  - handoffCount
  - dropSignals
  - topIntents
  - unresolvedByIntent
- Muc dich:
  - Xac dinh intent fail nhieu nhat.
  - Tim diem roi bo de toi uu luong hoi dap.

## 6) Bao mat va quan tri rui ro
- Chan cau hoi noi bo he thong (source, secret, schema, config).
- Gioi han pham vi tra loi theo nganh hang dich vu.
- Giam rui ro hallucinaton:
  - Rule truoc, LLM sau.
  - Fallback co huong dan lien he nguoi that.

## 7) Danh gia ket qua
### 7.1 KPI ky thuat
- Ty le nhan dien intent dung: [__]%
- Ty le hoi lai thong minh dung luc: [__]%
- Ty le fallback tren tong request: [__]%
- Thoi gian phan hoi trung binh: [__] ms

### 7.2 KPI kinh doanh
- Ty le user tiep tuc hoi sau phan hoi dau: [__]%
- Ty le click suggestion/goi y: [__]%
- Ty le dieu huong thanh cong sang trang muc tieu: [__]%
- Ty le chuyen doi don hang co ho tro chatbot: [__]%

## 8) Ket qua noi bat (dien theo thuc te)
- [ ] Da trien khai confidence + clarifying question.
- [ ] Da co fallback CSKH chuan.
- [ ] Da co session memory.
- [ ] Da thong nhat tone thuong hieu.
- [ ] Da co analytics endpoint.

## 9) Han che hien tai
- Analytics dang luu tam in-memory, mat khi restart service.
- Chua co dashboard truc quan cho team van hanh.
- Chua A/B test prompt va response format theo nhom nguoi dung.

## 10) Huong phat trien tiep theo
- Dua analytics vao Redis/PostgreSQL + dashboard.
- Them intent confidence calibration bang du lieu that.
- RAG cho FAQ/chinh sach de tang do chinh xac.
- Human handoff theo SLA va muc do uu tien.
- Ca nhan hoa sau dang nhap (lich su don, khau vi, tan suat mua).

## 11) Ket luan
Mo hinh hybrid AI chatbot cho EATOMO giup can bang giua do chinh xac nghiep vu va tinh linh hoat ngon ngu. Cac thanh phan confidence, clarifying, fallback chuan CSKH, session memory va analytics la nen tang de he thong van hanh chuyen nghiep, an toan va toi uu lien tuc theo du lieu thuc te.

---

## Phu luc A - Checklist viet bao cao nhanh
- [ ] Co mo ta bai toan va muc tieu ro rang.
- [ ] Co mo hinh kien truc va luong xu ly.
- [ ] Co giai thich confidence + hoi lai thong minh.
- [ ] Co fallback CSKH va kenh lien he.
- [ ] Co memory theo phien va vi du ap dung.
- [ ] Co bo chi so analytics + cach do.
- [ ] Co KPI truoc/sau trien khai.
- [ ] Co han che va roadmap nang cap.

## Phu luc B - Mau bang KPI
| Nhom KPI | Chi so | Truoc | Sau | Muc tieu |
|---|---|---:|---:|---:|
| Chat quality | Intent accuracy | [__] | [__] | [__] |
| Chat quality | Clarify success rate | [__] | [__] | [__] |
| Operations | Fallback rate | [__] | [__] | [__] |
| Business | Suggestion CTR | [__] | [__] | [__] |
| Business | Conversion assisted by bot | [__] | [__] | [__] |
