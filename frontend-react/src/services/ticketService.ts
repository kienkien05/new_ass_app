import api from './api'

export interface TicketType {
    id: string
    event_id: string
    event_title?: string
    name: string
    description?: string
    price: number
    original_price?: number
    quantity_total: number
    quantity_sold: number
    status: 'active' | 'sold_out' | 'hidden'
}

export interface CreateTicketTypeData {
    event_id: string
    name: string
    price: number
    quantity_total: number
    description?: string
}

export const ticketService = {
    getTicketTypes: async (params?: { event_id?: string }) => {
        const response = await api.get('/ticket-types', { params })
        return response.data.data
    },

    createTicketType: async (data: CreateTicketTypeData) => {
        const response = await api.post('/ticket-types', data)
        return response.data.data
    },

    updateTicketType: async (id: string, data: Partial<CreateTicketTypeData> & { status?: string }) => {
        const response = await api.put(`/ticket-types/${id}`, data)
        return response.data.data
    },

    deleteTicketType: async (id: string) => {
        const response = await api.delete(`/ticket-types/${id}`)
        return response.data
    },

    resendTicketEmails: async (ticketIds: string[]) => {
        const response = await api.post('/tickets/resend-email', { ticketIds })
        return response.data
    },

    getMyTickets: async () => {
        const response = await api.get('/tickets/my-tickets')
        return response.data.data
    },

    createManualTicket: async (data: {
        email: string
        eventId: string
        ticketTypeId: string
        seatId?: string
        customPrice?: number
    }) => {
        const response = await api.post('/tickets/create-manual', data)
        return response.data
    }
}
