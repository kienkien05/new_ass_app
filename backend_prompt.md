# Backend Technical Specification & Handoff

## Project Context
**EViENT** is an event management platform where users can browse events, buy tickets, and manage their wallets. Admins can manage events, users, tickets, and scan tickets.
The frontend is built with HTML/Tailwind/JS. The backend will be a REST API (likely Node.js/Express or Python/FastAPI, but this spec is language-agnostic).

## 1. Database Schema Design (Relational)

### Core Tables

#### `users`
- `id` (UUID, PK)
- `email` (VARCHAR, Unique, Not Null)
- `password_hash` (VARCHAR, Not Null)
- `full_name` (VARCHAR)
- `avatar_url` (VARCHAR, Nullable)
- `role` (ENUM: 'user', 'admin') - Default 'user'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `is_active` (BOOLEAN) - Default true

#### `events`
- `id` (UUID, PK)
- `title` (VARCHAR, Not Null)
- `slug` (VARCHAR, Unique, Not Null)
- `description` (TEXT)
- `content` (TEXT) - HTML content
- `location` (VARCHAR)
- `start_time` (TIMESTAMP)
- `end_time` (TIMESTAMP)
- `banner_image` (VARCHAR)
- `thumbnail_image` (VARCHAR)
- `category` (VARCHAR) - e.g., 'Music', 'Tech'
- `status` (ENUM: 'draft', 'published', 'cancelled', 'completed')
- `is_hot` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `ticket_types`
- `id` (UUID, PK)
- `event_id` (UUID, FK -> events.id)
- `name` (VARCHAR) - e.g., 'VIP', 'GA'
- `description` (TEXT)
- `price` (DECIMAL)
- `original_price` (DECIMAL, Nullable)
- `quantity_total` (INTEGER)
- `quantity_sold` (INTEGER) - Default 0
- `status` (ENUM: 'active', 'sold_out', 'hidden')

#### `orders`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `total_amount` (DECIMAL)
- `status` (ENUM: 'pending', 'paid', 'cancelled', 'refunded')
- `payment_method` (VARCHAR)
- `payment_transaction_id` (VARCHAR)
- `created_at` (TIMESTAMP)

#### `tickets` (The actual issued ticket)
- `id` (UUID, PK)
- `order_id` (UUID, FK -> orders.id)
- `ticket_type_id` (UUID, FK -> ticket_types.id)
- `user_id` (UUID, FK -> users.id)
- `event_id` (UUID, FK -> events.id) - Denormalized for query speed
- `ticket_code` (VARCHAR, Unique) - QR Code string
- `status` (ENUM: 'valid', 'used', 'cancelled')
- `used_at` (TIMESTAMP, Nullable)
- `price_at_purchase` (DECIMAL)

#### `banners`
- `id` (INTEGER, PK)
- `title` (VARCHAR)
- `image_url` (VARCHAR)
- `link_url` (VARCHAR)
- `event_id` (UUID, Nullable, FK -> events.id)
- `priority` (INTEGER)
- `is_active` (BOOLEAN)

#### `notifications`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `title` (VARCHAR)
- `message` (TEXT)
- `type` (ENUM: 'system', 'order', 'promotion')
- `is_read` (BOOLEAN)
- `created_at` (TIMESTAMP)

---

## 2. API Endpoints Specification

All API responses should follow a standard format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "error": null
}
```

### Authentication
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ token, user: { id, email, role, ... } }`
- `POST /api/auth/register`
  - Body: `{ email, password, full_name }`
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user: { ... } }`

### Users
- `GET /api/users/profile` (Auth required)
- `PUT /api/users/profile` (Auth required)
  - Body: `{ full_name, avatar_url, old_password, new_password }`
- `GET /api/users/tickets`
  - Query: `?status=valid`
  - Response: List of user's tickets with event details.

### Events (Public)
- `GET /api/events`
  - Query: `?page=1&limit=10&category=music&search=keyword`
  - Response: Paginated list of events.
- `GET /api/events/featured`
  - Response: List of hot/featured events for Home page.
- `GET /api/events/:id`
  - Response: Detailed event info + `ticket_types` availability.

### Orders & Checkout
- `POST /api/orders` (Auth required)
  - Body: `{ ticket_items: [{ ticket_type_id, quantity }] }`
  - Logic: Check limits, Create Order (Pending), Return Payment URL or confirm if free.

### Admin
- `GET /api/admin/stats`
  - Response: `{ total_revenue, total_tickets, total_users, ... }`
- `GET /api/admin/scanners/validate`
  - Query: `?code=XYZ`
  - Logic: Check if ticket exists, if `status` is 'valid'.
- `POST /api/admin/scanners/checkin`
  - Body: `{ code }`
  - Logic: Update ticket status to 'used', set `used_at`.
- `GET /api/admin/users`, `GET /api/admin/events` (CRUD for entities)

---

## 3. Frontend Integration Requirements
- **Global**: Handle 401 Unauthorized by clearing token & redirecting to Login.
- **Home**: Fetch `GET /api/banners` and `GET /api/events/featured`.
- **Event Detail**: Fetch `GET /api/events/:id`. Show "Sold Out" if `quantity_sold >= quantity_total`.
- **Wallet**: Fetch `GET /api/users/tickets`.
- **Admin**: Bind Dashboard stats to `GET /api/admin/stats`.

## 4. Mock Data Generation (For Development)
- Please implement a seeder script (`seed.js`) to populate:
  - 1 Admin user (`admin@evient.com` / `admin123`)
  - 10 Random users
  - 5 Events (2 Past, 3 Future)
  - 20 Tickets (Some used, some valid)
