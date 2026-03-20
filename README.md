# 🎫 Hệ thống Check-in QR

Hệ thống check-in QR động cho sự kiện — chống quét trùng, quét trùng hiện cảnh báo đỏ.

---

## 📋 Cách deploy lên Render.com (miễn phí, ~10 phút)

### Bước 1: Tạo tài khoản GitHub (nếu chưa có)
1. Vào https://github.com → Sign up (miễn phí)

### Bước 2: Tạo repository mới
1. Vào https://github.com/new
2. Đặt tên: `checkin-app`
3. Chọn **Public** → nhấn **Create repository**

### Bước 3: Upload code lên GitHub
1. Trên trang repo vừa tạo, nhấn **uploading an existing file**
2. Kéo thả **toàn bộ các file** trong folder `checkin-app` vào
3. Nhấn **Commit changes**

### Bước 4: Deploy lên Render
1. Vào https://render.com → Sign up với tài khoản GitHub
2. Nhấn **New +** → chọn **Web Service**
3. Chọn repo `checkin-app` vừa tạo → nhấn **Connect**
4. Điền thông tin:
   - **Name**: `checkin-app` (hoặc bất kỳ)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: chọn **Free**
5. Nhấn **Create Web Service**
6. Chờ ~3 phút để deploy xong

### Bước 5: Mở app
- Render sẽ cấp link dạng: `https://checkin-app-xxxx.onrender.com`
- Đó là link trang quản trị của bạn
- Link trang quét QR: `https://checkin-app-xxxx.onrender.com/scanner.html`

---

## 🖥 Cách sử dụng

### Trang quản trị (dành cho bạn)
1. Mở link chính → thấy trang admin
2. Nhấn **Đổi tên sự kiện** (nhấn vào tên ở góc trên trái)
3. Upload file CSV danh sách khách:
   - File CSV có 2 cột: `Họ tên` và `Phòng ban`
   - Hoặc file TXT: mỗi dòng một tên
4. Nhấn nút **QR** bên cạnh từng người để xem & tải QR
5. Gửi file QR đó cho từng người qua Zalo/email

### Format file CSV mẫu:
```
Họ tên,Phòng ban
Nguyễn Văn An,Marketing
Trần Thị Bình,Kỹ thuật
Lê Minh Cường,Ban Giám đốc
```

### Trang quét QR (dành cho nhân viên tại cổng)
1. Gửi link `/scanner.html` cho nhân viân check-in
2. Mở trên điện thoại → cho phép camera
3. Đưa QR của khách vào khung
4. Xanh = OK, Đỏ = đã quét rồi, Vàng = QR lạ

---

## ⚠️ Lưu ý quan trọng

- Render **Free tier sẽ ngủ** sau 15 phút không có request → lần đầu mở sẽ chậm ~30 giây
- Để tránh điều này ngày sự kiện: mở app trước 5 phút, hoặc nâng gói ($7/tháng)
- Dữ liệu lưu trong file `checkin.db` trên server → nếu deploy lại sẽ mất data
  - Giải pháp: xuất CSV trước khi reset, hoặc dùng database ngoài (liên hệ dev)

---

## 🔧 Chạy thử trên máy tính (không bắt buộc)

```bash
# Cần cài Node.js từ https://nodejs.org
cd checkin-app
npm install
node server.js
# Mở http://localhost:3000
```
