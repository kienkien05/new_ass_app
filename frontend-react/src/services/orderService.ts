import api from './api'
import type { ApiResponse, Order, Ticket, OrderItem } from '@/types'

interface CreateOrderData {
    ticket_items: OrderItem[]
}

interface CreateOrderResponse {
    order: Order
    tickets: Ticket[]
}

export const orderService = {
    createOrder: async (data: CreateOrderData): Promise<CreateOrderResponse> => {
        const response = await api.post<ApiResponse<CreateOrderResponse>>('/orders', data)
        return response.data.data
    },

    getMyTickets: async (): Promise<Ticket[]> => {
        const response = await api.get<ApiResponse<Ticket[]>>('/users/tickets')
        return response.data.data
    },
}
