import { create } from 'zustand'

// Shared ticket data between admin orders and user wallet
export interface SoldTicket {
    id: string
    ticket_code: string
    event_id: string
    event_title: string
    event_date: string
    event_location: string
    price: number
    buyer_id: string
    buyer_name: string
    buyer_email: string
    purchase_date: string
    status: 'valid' | 'used' | 'cancelled'
    seat?: {
        id?: string
        room: string
        row: string
        number: number
    }
}

// Mock sold tickets data - shared between admin and user
const mockSoldTickets: SoldTicket[] = [
    {
        id: '1',
        ticket_code: 'EVT-2026-001234',
        event_id: '1',
        event_title: 'Concert Sơn Tùng M-TP',
        event_date: '2026-02-14',
        event_location: 'Sân vận động Mỹ Đình, Hà Nội',
        price: 500000,
        buyer_id: 'user1',
        buyer_name: 'Nguyễn Văn A',
        buyer_email: 'nguyenvana@gmail.com',
        purchase_date: '2026-01-05',
        status: 'valid',
        seat: { id: 'seat1', room: 'Phòng chiếu 1', row: 'A', number: 1 }
    },
    {
        id: '2',
        ticket_code: 'EVT-2026-001235',
        event_id: '1',
        event_title: 'Concert Sơn Tùng M-TP',
        event_date: '2026-02-14',
        event_location: 'Sân vận động Mỹ Đình, Hà Nội',
        price: 500000,
        buyer_id: 'user2',
        buyer_name: 'Trần Thị B',
        buyer_email: 'tranthib@gmail.com',
        purchase_date: '2026-01-05',
        status: 'valid',
        seat: { room: 'Phòng chiếu 1', row: 'A', number: 2 }
    },
    {
        id: '3',
        ticket_code: 'EVT-2026-001236',
        event_id: '2',
        event_title: 'Vietnam Tech Conference',
        event_date: '2026-03-20',
        event_location: 'GEM Center, TP.HCM',
        price: 350000,
        buyer_id: 'user3',
        buyer_name: 'Lê Văn C',
        buyer_email: 'levanc@gmail.com',
        purchase_date: '2026-01-06',
        status: 'used',
        seat: { room: 'Phòng chiếu 2', row: 'B', number: 5 }
    },
    {
        id: '4',
        ticket_code: 'EVT-2026-001237',
        event_id: '2',
        event_title: 'Vietnam Tech Conference',
        event_date: '2026-03-20',
        event_location: 'GEM Center, TP.HCM',
        price: 350000,
        buyer_id: 'user4',
        buyer_name: 'Phạm Thị D',
        buyer_email: 'phamthid@gmail.com',
        purchase_date: '2026-01-07',
        status: 'valid',
        seat: { room: 'Phòng chiếu 2', row: 'B', number: 6 }
    },
    {
        id: '5',
        ticket_code: 'EVT-2026-001238',
        event_id: '3',
        event_title: 'Lễ hội Ẩm thực Sài Gòn',
        event_date: '2026-04-10',
        event_location: 'Công viên 23/9, TP.HCM',
        price: 150000,
        buyer_id: 'user5',
        buyer_name: 'Hoàng Văn E',
        buyer_email: 'hoangvane@gmail.com',
        purchase_date: '2026-01-08',
        status: 'cancelled'
    },
]

interface TicketStore {
    tickets: SoldTicket[]

    // Get all tickets (for admin)
    getAllTickets: () => SoldTicket[]

    // Get tickets for a specific user (for user wallet)
    getUserTickets: (userId: string) => SoldTicket[]

    // Update ticket status
    updateTicketStatus: (ticketId: string, status: 'valid' | 'used' | 'cancelled') => void

    // Add a new ticket (when user purchases)
    addTicket: (ticket: SoldTicket) => void
}

export const useTicketStore = create<TicketStore>((set, get) => ({
    tickets: mockSoldTickets,

    getAllTickets: () => get().tickets,

    getUserTickets: (userId: string) =>
        get().tickets.filter(t => t.buyer_id === userId),

    updateTicketStatus: (ticketId: string, status: 'valid' | 'used' | 'cancelled') => {
        set((state) => ({
            tickets: state.tickets.map((t) =>
                t.id === ticketId ? { ...t, status } : t
            ),
        }))
    },

    addTicket: (ticket: SoldTicket) => {
        set((state) => ({
            tickets: [...state.tickets, ticket],
        }))
    },
}))

// Helper to convert SoldTicket to format expected by WalletPage (Ticket type)
export const convertToWalletTicket = (soldTicket: SoldTicket) => ({
    id: soldTicket.id,
    ticket_code: soldTicket.ticket_code,
    status: soldTicket.status,
    price_at_purchase: soldTicket.price,
    purchase_date: soldTicket.purchase_date,
    created_at: soldTicket.purchase_date,
    event: {
        id: soldTicket.event_id,
        title: soldTicket.event_title,
        start_time: soldTicket.event_date,
        location: soldTicket.event_location,
    },
    ticket_type: {
        id: '1',
        name: 'Vé thường',
    },
    seat: soldTicket.seat,
})
