// ==================== API Types ====================

export interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
    error?: string
}

export interface PaginatedResponse<T> {
    success: boolean
    data: T[]
    pagination: {
        page: number
        pages: number
        total: number
    }
}

// ==================== User Types ====================

export type UserRole = 'user' | 'admin'

export interface User {
    id: string
    email: string
    full_name: string
    avatar_url?: string
    role: UserRole
    created_at: string
    phone_number?: string
    facebook_url?: string
    gender?: 'male' | 'female' | 'other'
    address?: string
    date_of_birth?: string
}

export interface AuthResponse {
    id: string
    email: string
    full_name: string
    role: UserRole
    avatar_url?: string
    token: string
    phone_number?: string
    facebook_url?: string
    gender?: 'male' | 'female' | 'other'
    address?: string
    date_of_birth?: string
}

// ==================== Event Types ====================

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

export interface Event {
    id: string
    title: string
    slug: string
    description?: string
    content?: string
    location?: string
    start_time?: string
    end_time?: string
    banner_image?: string
    thumbnail_image?: string
    category?: string
    status: EventStatus
    is_hot: boolean
    created_at: string
    ticket_types?: TicketType[]
    max_tickets_per_user?: number
}

// ==================== Ticket Types ====================

export type TicketTypeStatus = 'active' | 'sold_out' | 'hidden'

export interface TicketType {
    id: string
    name: string
    description?: string
    price: number
    original_price?: number
    quantity_total: number
    quantity_sold: number
    status: TicketTypeStatus
}

export type TicketStatus = 'valid' | 'used' | 'cancelled'

export interface Ticket {
    id: string
    ticket_code: string
    status: TicketStatus
    used_at?: string
    price_at_purchase: number
    purchase_date?: string
    created_at: string
    event: {
        id: string
        title: string
        start_time?: string
        location?: string
        banner_image?: string
    }
    ticket_type: {
        id: string
        name: string
    }
    seat?: {
        room: string
        row: string
        number: number
    }
}

// ==================== Order Types ====================

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'

export interface Order {
    id: string
    total_amount: number
    status: OrderStatus
    payment_method?: string
    created_at: string
}

export interface OrderItem {
    ticket_type_id: string
    quantity: number
}

// ==================== Banner Types ====================

export interface Banner {
    id: number
    title: string
    image_url: string
    link_url?: string
    event_id?: string
    priority: number
    is_active: boolean
}
