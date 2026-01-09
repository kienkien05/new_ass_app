import api from './api'
import type { ApiResponse, PaginatedResponse, Event } from '@/types'

interface GetEventsParams {
    page?: number
    limit?: number
    category?: string
    search?: string
}

interface CreateEventData {
    title: string
    description?: string
    content?: string
    location?: string
    start_time?: string
    end_time?: string
    banner_image?: string
    thumbnail_image?: string
    category?: string
    status?: string
    is_hot?: boolean
    room_ids?: string[]
    // Inline ticket types
    ticket_types?: {
        name: string
        price: number
        quantity_total: number
        description?: string
    }[]
    // Banner options
    create_banner?: boolean
    banner_is_homepage?: boolean
    banner_priority?: number
}

export const eventService = {
    getEvents: async (params: GetEventsParams = {}): Promise<PaginatedResponse<Event>> => {
        const response = await api.get<PaginatedResponse<Event>>('/events', { params })
        return response.data
    },

    getEventById: async (id: string): Promise<Event> => {
        const response = await api.get<ApiResponse<Event>>(`/events/${id}`)
        return response.data.data
    },

    getFeaturedEvents: async (): Promise<Event[]> => {
        const response = await api.get<ApiResponse<Event[]>>('/events/featured')
        return response.data.data
    },

    createEvent: async (data: CreateEventData): Promise<Event> => {
        const response = await api.post<ApiResponse<Event>>('/events', data)
        return response.data.data
    },

    updateEvent: async (id: string, data: Partial<CreateEventData>): Promise<Event> => {
        const response = await api.put<ApiResponse<Event>>(`/events/${id}`, data)
        return response.data.data
    },

    deleteEvent: async (id: string): Promise<void> => {
        await api.delete(`/events/${id}`)
    },
}
