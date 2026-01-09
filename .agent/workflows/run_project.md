---
description: Hướng dẫn chạy toàn bộ dự án EViENT (Backend + Frontend)
---

# Cách chạy dự án EViENT

Quy trình này sẽ hướng dẫn bạn khởi động cả Backend (Node.js) và Frontend (static server) để chạy đầy đủ tính năng.

## 1. Yêu cầu tiên quyết
- Node.js (v18 trở lên)
- MongoDB Connection String (trong file `backend/.env`)

## 2. Khởi động Backend
Mở một terminal mới và chạy các lệnh sau:

```bash
cd backend
npm install
# (Tùy chọn) Nạp dữ liệu mẫu nếu chạy lần đầu
# npm run seed
npm run dev
```
> Server sẽ chạy tại: `http://localhost:5000`

## 3. Khởi động Frontend
Mở một terminal **khác** (giữ terminal backend chạy):

```bash
# Tại thư mục gốc dự án (c:\mini-project\new_ass_app)
npm install
```

### Chạy Tailwind CSS Watcher (Để biên dịch CSS khi sửa code)
```bash
npx tailwindcss -i ./frontend/css/input.css -o ./frontend/css/output.css --watch
```

### Chạy Web Server
Mở thêm một terminal thứ 3 (hoặc dùng terminal trên nếu không cần watch CSS):

```bash
npx -y http-server ./frontend -p 8080 -c-1
```
> Frontend sẽ chạy tại: `http://localhost:8080`

## 4. Truy cập
- Mở trình duyệt vào: [http://localhost:8080/pages/user/home.html](http://localhost:8080/pages/user/home.html)
