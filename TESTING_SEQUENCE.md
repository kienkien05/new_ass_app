# QUY TRÌNH KIỂM THỬ HỆ THỐNG (SYSTEM TESTING SEQUENCE)

Tài liệu này mô tả chi tiết các bước kiểm thử hệ thống EViENT để báo cáo cho Developer và Project Manager.

## 1. Chuẩn Bị Môi Trường (Preparation)

Trước khi bắt đầu test, đảm bảo hệ thống đã được khởi chạy đầy đủ:

- **Backend**: Container `evient-backend` đang chạy (Port 5000).
- **Frontend**: Container `evient-frontend` đang chạy (Port 3000).
- **Database**: Container `evient-db` (PostgreSQL) đang chạy.
- **MailHog**: Container `evient-mailhog` đang chạy (Port 8025 - dùng để nhận email OTP test).

**Truy cập:**
- Web App: [http://localhost:3000](http://localhost:3000)
- MailHog (Check Email): [http://localhost:8025](http://localhost:8025)

---

## 2. Test Quy Trình Xác Thực (Authentication Flow)

### 2.1. Đăng Ký Tài Khoản Mới (User Registration)
1. Truy cập trang **Đăng nhập**, chọn tab **Đăng ký**.
2. Nhập thông tin: Họ tên, Email, Mật khẩu.
3. Nhấn **Đăng ký**. Hệ thống thông báo đã gửi OTP.
4. Mở tab mới truy cập **MailHog** ([http://localhost:8025](http://localhost:8025)).
5. Tìm email mới nhất từ "EViENT", lấy mã OTP 6 số.
6. Quay lại web, nhập mã OTP vào trang xác thực.
7. **Kết quả mong đợi**: Đăng ký thành công, tự động chuyển hướng vào trang chủ hoặc đăng nhập.

### 2.2. Đăng Nhập (Login)
1. Truy cập trang **Đăng nhập**.
2. Nhập Email và Mật khẩu vừa đăng ký.
3. Nhấn **Đăng nhập**. Hệ thống yêu cầu OTP.
4. Kiểm tra **MailHog**, lấy mã OTP mới.
5. Nhập OTP và xác nhận.
6. **Kết quả mong đợi**: Đăng nhập thành công, lưu token vào trình duyệt, hiển thị Avatar người dùng.

---

## 3. Test Chức Năng Admin (Admin Functions)

*Sử dụng tài khoản có quyền Admin để thực hiện.*

### 3.1. Quản Lý Sự Kiện (Event Management)
1. Vào trang **Quản trị (Admin Dashboard)** -> **Sự kiện**.
2. **Thêm mới**:
   - Nhập đầy đủ: Tên, Mô tả, Địa điểm, Thời gian, Hình ảnh Banner/Thumbnail.
   - Thêm các **Loại vé (Ticket Types)**: Ví dụ "VIP", "Standard" với giá và số lượng khác nhau.
   - Chọn **Phòng/Sơ đồ ghế**.
   - Lưu sự kiện.
3. **Sửa sự kiện**: Thay đổi thông tin, cập nhật giá vé.
4. **Xóa sự kiện**: Thử xóa sự kiện vừa tạo (đã fix lỗi 500).
   - **Kết quả mong đợi**: Sự kiện được xóa thành công cùng các dữ liệu liên quan.

### 3.2. Quản Lý Banner
1. Vào menu **Banners**.
2. Upload banner mới, gán cho một sự kiện hoặc trang chủ.
3. Ra trang chủ (Home) kiểm tra banner có hiển thị không.

### 3.3. Sơ Đồ Ghế (Room/Seat Map)
1. Vào menu **Phòng thi/Rạp**.
2. Chọn một phòng, kiểm tra hiển thị sơ đồ ghế.
3. Thử bật/tắt trạng thái bảo trì của một ghế bất kỳ.

---

## 4. Test Luồng Người Dùng (User Journey)

*Sử dụng tài khoản User thường.*

### 4.1. Tìm Kiếm & Xem Chi Tiết
1. Tại Trang chủ, bấm vào một sự kiện bất kỳ.
2. Kiểm tra trang **Chi tiết sự kiện**:
   - Hiển thị đúng thông tin mô tả, thời gian, địa điểm.
   - Danh sách các loại vé và giá tiền đúng như Admin đã cấu hình.

### 4.2. Đặt Vé (Booking Flow)
1. Tại trang chi tiết, nhấn **Mua vé**.
2. **Chọn ghế**: Nếu sự kiện có sơ đồ ghế, chọn 1 hoặc nhiều ghế.
3. **Giỏ hàng**: Kiểm tra tổng tiền tính toán chính xác.
4. **Thanh toán**: Nhấn thanh toán (Môi trường test sẽ mô phỏng thanh toán thành công).
5. **Kết quả mong đợi**: Thông báo đặt vé thành công.

### 4.3. Vé Của Tôi (My Tickets)
1. Vào menu **Hồ sơ (Profile)** hoặc **Vé của tôi**.
2. Kiểm tra danh sách vé vừa mua.
3. Bấm xem chi tiết vé để thấy **QR Code**.

---

## 5. Kiểm Tra Kỹ Thuật & Logs (Technical Verification)

### 5.1. Kiểm tra Database
- Đảm bảo dữ liệu `Users`, `Events`, `Tickets` được tạo mới trong database.

### 5.2. Kiểm tra Logs (Nếu có lỗi)
- Nếu gặp lỗi 500 hoặc hành vi lạ, chạy lệnh sau để lấy log báo cho Dev:
  ```bash
  docker logs evient-backend
  ```
- Copy đoạn log lỗi gửi kèm báo cáo.

---

## 6. Mẫu Báo Cáo Lỗi (Bug Report Template)

Khi gặp lỗi, vui lòng ghi lại theo mẫu:
- **Tên lỗi**: (Ví dụ: Không thể xóa sự kiện đã bán vé)
- **Các bước tái hiện (Steps to Reproduce)**:
  1. Đăng nhập Admin
  2. Vào quản lý sự kiện
  3. Bấm xóa sự kiện id ABC
- **Kết quả thực tế**: Hiện lỗi 500 Internal Server Error.
- **Thời gian**: ...
- **Log đính kèm**: ...
