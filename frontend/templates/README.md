# Frontend Templates

Thư mục này chứa các template chuẩn để tạo trang mới. Sử dụng các file này làm điểm khởi đầu khi tạo trang admin hoặc user mới.

## Files

| Template | Mô tả | Dùng cho |
|----------|-------|----------|
| `admin-template.html` | Layout admin với sidebar + header | Dashboard, Users, Banners, Scanners, etc. |
| `user-template.html` | Layout user với navbar + footer | Home, Event Detail, Ticket Wallet, etc. |

## Cách sử dụng

### Admin Template
1. Copy nội dung `admin-template.html`
2. Thay `<!-- PAGE_TITLE -->` bằng tiêu đề trang (VD: "Thống kê")
3. Thay `<!-- PAGE_NAME -->` trong breadcrumb
4. Thêm class active cho nav item tương ứng
5. Thêm nội dung vào khu vực `<!-- PAGE CONTENT HERE -->`

### User Template
1. Copy nội dung `user-template.html`
2. Thay `<!-- PAGE_TITLE -->`
3. Thêm class active cho nav link tương ứng
4. Thêm nội dung vào `<main>`

## Lưu ý về Navigation

**Active nav item (Admin):**
```html
<a class="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 transition-all" href="#">
    <span class="material-symbols-outlined icon-fill text-white">ICON</span>
    <span class="text-sm font-semibold">LABEL</span>
</a>
```

**Inactive nav item (Admin):**
```html
<a class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors group" href="page.html">
    <span class="material-symbols-outlined group-hover:text-primary transition-colors">ICON</span>
    <span class="text-sm font-medium">LABEL</span>
</a>
```
