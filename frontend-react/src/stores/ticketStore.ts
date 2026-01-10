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
    qr_code?: string
    status: 'valid' | 'used' | 'cancelled'
    seat?: {
        id?: string
        room: string
        row: string
        number: number
    }
}

// Tickets will be fetched from API - no mock data
const mockSoldTickets: SoldTicket[] = []

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
