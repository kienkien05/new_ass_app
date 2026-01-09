import api from './api'
import type { Room } from '@/stores/roomStore'

interface ApiResponse<T> {
    status: string
    data: T
    message?: string
}

export const roomService = {
    getRooms: async () => {
        const response = await api.get<ApiResponse<Room[]>>('/rooms')
        return response.data
    },

    createRoom: async (data: { name: string; rows: number; seatsPerRow: number }) => {
        const response = await api.post<ApiResponse<Room>>('/rooms', data)
        return response.data
    },

    updateRoom: async (id: string, data: Partial<Room>) => {
        const response = await api.put<ApiResponse<Room>>(`/rooms/${id}`, data)
        return response.data
    },

    deleteRoom: async (id: string) => {
        const response = await api.delete<ApiResponse<any>>(`/rooms/${id}`)
        return response.data
    },

    toggleRoomActive: async (id: string) => {
        const response = await api.patch<ApiResponse<Room>>(`/rooms/${id}/toggle`)
        return response.data
    },

    toggleSeatActive: async (roomId: string, seatId: string) => {
        const response = await api.patch<ApiResponse<any>>(`/rooms/${roomId}/seats/${seatId}/toggle`)
        return response.data
    },

    updateRoomSeats: async (roomId: string, seats: { id: string; isActive: boolean }[]) => {
        const response = await api.put<ApiResponse<any>>(`/rooms/${roomId}/seats`, { seats })
        return response.data
    }
}
