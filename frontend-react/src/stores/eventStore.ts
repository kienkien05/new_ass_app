import { create } from 'zustand'

export interface AppEvent {
    id: string
    title: string
    slug: string
    description: string
    location: string
    start_time: string
    end_time?: string
    banner_image: string
    category: string
    status: 'draft' | 'published' | 'cancelled' | 'completed'
    is_hot: boolean
    price: number
    total_tickets: number
    sold_tickets: number
    created_at: string
}

// Mock events data - shared across all pages
const mockEvents: AppEvent[] = [
    {
        id: '1',
        title: 'Concert Sơn Tùng M-TP',
        slug: 'concert-son-tung-mtp',
        description: 'Đêm nhạc đặc biệt của Sơn Tùng M-TP tại Sân vận động Mỹ Đình',
        location: 'Sân vận động Mỹ Đình, Hà Nội',
        start_time: '2026-02-14T19:00:00',
        banner_image: '/images/banner.png',
        category: 'Âm nhạc',
        status: 'published',
        is_hot: true,
        price: 500000,
        total_tickets: 200,
        sold_tickets: 45,
        created_at: '2026-01-01',
    },
    {
        id: '2',
        title: 'Vietnam Tech Conference',
        slug: 'vietnam-tech-conference',
        description: 'Hội nghị công nghệ lớn nhất Việt Nam năm 2026',
        location: 'GEM Center, TP.HCM',
        start_time: '2026-03-20T08:00:00',
        banner_image: '/images/banner.png',
        category: 'Công nghệ',
        status: 'published',
        is_hot: true,
        price: 350000,
        total_tickets: 100,
        sold_tickets: 100,
        created_at: '2026-01-05',
    },
    {
        id: '3',
        title: 'Lễ hội Ẩm thực Sài Gòn',
        slug: 'le-hoi-am-thuc-saigon',
        description: 'Khám phá hương vị ẩm thực đường phố Sài Gòn',
        location: 'Công viên 23/9, TP.HCM',
        start_time: '2026-04-10T10:00:00',
        banner_image: '/images/banner.png',
        category: 'Ẩm thực',
        status: 'published',
        is_hot: false,
        price: 150000,
        total_tickets: 500,
        sold_tickets: 0,
        created_at: '2026-01-08',
    },
    {
        id: '4',
        title: 'Đêm Nhạc Trịnh - Acoustic Night',
        slug: 'dem-nhac-trinh-acoustic',
        description: 'Tưởng nhớ nhạc sĩ Trịnh Công Sơn với những ca khúc bất hủ',
        location: 'Nhà hát Lớn Hà Nội',
        start_time: '2026-05-01T20:00:00',
        banner_image: '/images/banner.png',
        category: 'Âm nhạc',
        status: 'draft',
        is_hot: false,
        price: 300000,
        total_tickets: 150,
        sold_tickets: 0,
        created_at: '2026-01-10',
    },
    {
        id: '5',
        title: 'Hội chợ Startup Việt Nam',
        slug: 'hoi-cho-startup-vietnam',
        description: 'Kết nối các startup Việt Nam với nhà đầu tư',
        location: 'Trung tâm Hội nghị Quốc gia',
        start_time: '2026-06-15T09:00:00',
        banner_image: '/images/banner.png',
        category: 'Kinh doanh',
        status: 'published',
        is_hot: false,
        price: 200000,
        total_tickets: 300,
        sold_tickets: 50,
        created_at: '2026-01-12',
    },
]

interface EventStore {
    events: AppEvent[]

    getAllEvents: () => AppEvent[]
    getPublishedEvents: () => AppEvent[]
    getHotEvents: () => AppEvent[]
    getEventById: (id: string) => AppEvent | undefined
    getEventBySlug: (slug: string) => AppEvent | undefined

    addEvent: (event: Omit<AppEvent, 'id' | 'created_at' | 'sold_tickets'>) => void
    updateEvent: (id: string, data: Partial<AppEvent>) => void
    deleteEvent: (id: string) => void

    // For ticket purchase
    incrementSoldTickets: (eventId: string) => boolean
    hasAvailableTickets: (eventId: string) => boolean
}

export const useEventStore = create<EventStore>((set, get) => ({
    events: mockEvents,

    getAllEvents: () => get().events,

    getPublishedEvents: () => get().events.filter(e => e.status === 'published'),

    getHotEvents: () => get().events.filter(e => e.is_hot && e.status === 'published'),

    getEventById: (id: string) => get().events.find(e => e.id === id),

    getEventBySlug: (slug: string) => get().events.find(e => e.slug === slug),

    addEvent: (eventData) => {
        const newEvent: AppEvent = {
            ...eventData,
            id: `event${Date.now()}`,
            sold_tickets: 0,
            created_at: new Date().toISOString().split('T')[0],
        }
        set((state) => ({ events: [...state.events, newEvent] }))
    },

    updateEvent: (id, data) => {
        set((state) => ({
            events: state.events.map((e) => e.id === id ? { ...e, ...data } : e),
        }))
    },

    deleteEvent: (id) => {
        set((state) => ({
            events: state.events.filter((e) => e.id !== id),
        }))
    },

    incrementSoldTickets: (eventId) => {
        const event = get().events.find(e => e.id === eventId)
        if (!event || event.sold_tickets >= event.total_tickets) return false

        set((state) => ({
            events: state.events.map((e) =>
                e.id === eventId ? { ...e, sold_tickets: e.sold_tickets + 1 } : e
            ),
        }))
        return true
    },

    hasAvailableTickets: (eventId) => {
        const event = get().events.find(e => e.id === eventId)
        return event ? event.sold_tickets < event.total_tickets : false
    },
}))
