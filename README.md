# 🎫 EViENT - Nền Tảng Quản Lý Sự Kiện

EViENT là một nền tảng quản lý sự kiện hiện đại, "full-stack", nơi người dùng có thể duyệt các sự kiện, mua vé và quản lý hồ sơ cá nhân. Ứng dụng cũng cung cấp một bảng điều khiển quản trị mạnh mẽ để quản lý sự kiện, người dùng và quét vé.

## ✨ Tính Năng

### Tính Năng Người Dùng

- **Duyệt Sự Kiện:** Xem các sự kiện nổi bật và tất cả sự kiện với bộ lọc và phân trang.
- **Chi Tiết Sự Kiện:** Xem thông tin chi tiết về sự kiện, bao gồm mô tả, địa điểm và các loại vé.
- **Mua Vé:** Mua vé cho các sự kiện (Luồng thanh toán mô phỏng).
- **Ví/Hồ Sơ:** Quản lý hồ sơ người dùng và xem các vé đã mua.
- **Thiết Kế Đáp Ứng:** Giao diện tối ưu cho cả di động và máy tính.

### Tính Năng Quản Trị (Admin)

- **Bảng Điều Khiển (Dashboard):** Xem thống kê nền tảng (doanh thu, người dùng, vé).
- **Quản Lý Sự Kiện:** Tạo, cập nhật và quản lý các sự kiện.
- **Quản Lý Người Dùng:** Xem và quản lý người dùng trên nền tảng.
- **Quét Vé:** Xác thực vé thông qua mã QR hoặc nhập mã thủ công.

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React (Vite), TypeScript, Tailwind CSS, Shadcn/UI (Radix UI), Zustand (Quản lý trạng thái).
- **Backend:** Node.js, Express.js.
- **Cơ Sở Dữ Liệu:** PostgreSQL, Prisma ORM.
- **Hạ Tầng:** Docker, Docker Compose.

---

## 🚀 Hướng Dẫn Cài Đặt

Bạn có thể chạy EViENT bằng Docker (khuyên dùng) hoặc chạy thủ công trên máy cục bộ.

### Cách 1: Docker (Khuyên Dùng)

Chạy toàn bộ ứng dụng (Frontend + Backend + Database) chỉ với một lệnh.

1.  **Clone repository:**

    ```bash
    git clone <repository-url>
    cd EViENT/new_ass_app
    ```

2.  **Khởi động ứng dụng:**

    ```bash
    docker-compose up -d --build
    ```

3.  **Truy cập ứng dụng:**
    - **Frontend:** [http://localhost:3000](http://localhost:3000)
    - **Backend API:** [http://localhost:5000](http://localhost:5000)
    - **OTP gmail:**[http://localhost:5000](localhost:8025)
    - **Cơ Sở Dữ Liệu:** Được mở tại cổng `5432`.

### Cách 2: Cài Đặt Thủ Công (Local)

Nếu bạn muốn chạy từng dịch vụ riêng lẻ mà không dùng Docker.

#### Yêu Cầu

- Node.js (v18 trở lên)
- PostgreSQL (Đang chạy trên máy)

#### 1. Cài Đặt Backend

1.  Di chuyển vào thư mục backend:

    ```bash
    cd backend
    ```

2.  Cài đặt các gói phụ thuộc (dependencies):

    ```bash
    npm install
    ```

3.  Cấu Hình Biến Môi Trường:
    Tạo file `.env` trong thư mục `backend` với nội dung sau (nhớ cập nhật `DATABASE_URL` khớp với thông tin Postgres của bạn):

    ```env
    PORT=5000
    DATABASE_URL="postgresql://user:password@localhost:5432/evient_db?schema=public"
    JWT_SECRET="your_super_secret_key"
    CLOUDINARY_CLOUD_NAME="dyjoljvu4"
    CLOUDINARY_API_KEY="332377834468635"
    CLOUDINARY_API_SECRET="iG46JefDdy4RtakKTL4Kjk8r96s"
    NODE_ENV="development"
    ```

4.  Thiết Lập Cơ Sở Dữ Liệu:

    ```bash
    # Tạo Prisma Client
    npx prisma generate

    # Đẩy Schema lên Database
    npx prisma db push

    # Nạp dữ liệu mẫu (Tài khoản Admin, sự kiện, v.v.)
    npm run seed
    ```

5.  Khởi Động Backend:
    ```bash
    npm run dev
    ```

#### 2. Cài Đặt Frontend

1.  Di chuyển vào thư mục frontend:

    ```bash
    cd frontend-react
    ```

2.  Cài đặt các gói phụ thuộc:

    ```bash
    npm install
    ```

3.  Khởi Động Frontend:
    ```bash
    npm run dev
    ```
    Ứng dụng thường sẽ chạy tại [http://localhost:5173](http://localhost:5173) (mặc định của Vite) hoặc bạn có thể cấu hình thành 3000.

---

## 🔑 Tài Khoản Mặc Định

Script nạp dữ liệu (seeder) sẽ tạo sẵn một tài khoản Admin:

- **Email:** `admin@evient.com`
- **Mật khẩu:** `admin123`

---

## 📂 Cấu Trúc Dự Án

```
new_ass_app/
├── backend/              # Node.js/Express Backend
│   ├── prisma/           # Database schema
│   ├── src/              # Mã nguồn
│   └── ...
├── frontend-react/       # React Frontend
│   ├── src/              # Components, pages, hooks
│   └── ...
├── docker-compose.yml    # Cấu hình Docker services
└── README.md             # Tài liệu dự án
```

## 📝 Tài Liệu API

Backend cung cấp API chuẩn RESTful. Một số endpoint chính:

- `POST /api/auth/login`: Đăng nhập
- `GET /api/events`: Danh sách sự kiện
- `GET /api/events/:id`: Chi tiết sự kiện
- `POST /api/orders`: Tạo đơn mua vé

Để có danh sách đầy đủ, vui lòng tham khảo các định nghĩa route trong mã nguồn backend.

