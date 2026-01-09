import { create } from 'zustand'
import { roomService } from '@/services/roomService'

export interface Seat {
    id: string
    row: string
    number: number
    isActive: boolean
    roomId: string
}

export interface Room {
    id: string
    name: string
    rows: number
    seatsPerRow: number
    isActive: boolean
    seats: Seat[]
}

interface RoomStore {
    rooms: Room[]
    isLoading: boolean
    error: string | null

    fetchRooms: () => Promise<void>
    getAllRooms: () => Room[]
    getRoomById: (roomId: string) => Room | undefined
    getRoomForEvent: (eventId: string) => Room | undefined

    toggleSeatActive: (roomId: string, seatId: string) => Promise<void>
    isSeatAvailable: (roomId: string, seatId: string) => boolean

    addRoom: (room: { name: string; rows: number; seatsPerRow: number }) => Promise<void>
    updateRoom: (roomId: string, data: Partial<Room>) => Promise<void>
    deleteRoom: (roomId: string) => Promise<void>
    toggleRoomActive: (roomId: string) => Promise<void>
    updateRoomSeatsBatch: (roomId: string, seats: { id: string; isActive: boolean }[]) => Promise<void>
}

interface ApiResponse<T> {
    status: string
    data: T
    message?: string
}

export const useRoomStore = create<RoomStore>((set, get) => ({
    rooms: [],
    isLoading: false,
    error: null,

    fetchRooms: async () => {
        set({ isLoading: true, error: null })
        try {
            const response = await roomService.getRooms()
            const typedResponse = response as unknown as ApiResponse<Room[]>
            set({ rooms: typedResponse.data, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    getAllRooms: () => get().rooms,

    getRoomById: (roomId) => get().rooms.find((r) => r.id === roomId),

    getRoomForEvent: (...args: any[]) => {
        const eventId = args[0]
        // Simple fallback: return first active room
        const rooms = get().rooms
        return rooms.find(r => r.isActive) || rooms[0]
    },

    toggleSeatActive: async (roomId, seatId) => {
        const prevRooms = get().rooms
        // Optimistic update
        set((state) => ({
            rooms: state.rooms.map((room) => {
                if (room.id !== roomId) return room
                return {
                    ...room,
                    seats: room.seats.map((seat) =>
                        seat.id === seatId ? { ...seat, isActive: !seat.isActive } : seat
                    ),
                }
            }),
        }))

        try {
            await roomService.toggleSeatActive(roomId, seatId)
        } catch (error) {
            set({ rooms: prevRooms })
            console.error(error)
        }
    },

    isSeatAvailable: (roomId, seatId) => {
        const room = get().rooms.find((r) => r.id === roomId)
        if (!room) return false
        const seat = room.seats.find((s) => s.id === seatId)
        return seat?.isActive ?? false
    },

    addRoom: async (roomData) => {
        try {
            const response = await roomService.createRoom(roomData)
            const typedResponse = response as unknown as ApiResponse<Room>
            set((state) => ({ rooms: [typedResponse.data, ...state.rooms] }))
        } catch (error) {
            console.error(error)
        }
    },

    updateRoom: async (roomId, data) => {
        try {
            const response = await roomService.updateRoom(roomId, data)
            const typedResponse = response as unknown as ApiResponse<Room>
            set((state) => ({
                rooms: state.rooms.map((r) =>
                    r.id === roomId ? typedResponse.data : r
                ),
            }))
        } catch (error) {
            console.error(error)
        }
    },

    deleteRoom: async (roomId) => {
        try {
            await roomService.deleteRoom(roomId)
            set((state) => ({
                rooms: state.rooms.filter((r) => r.id !== roomId),
            }))
        } catch (error) {
            console.error(error)
        }
    },

    toggleRoomActive: async (roomId) => {
        try {
            const response = await roomService.toggleRoomActive(roomId)
            const typedResponse = response as unknown as ApiResponse<Room>
            set((state) => ({
                rooms: state.rooms.map((r) =>
                    r.id === roomId ? typedResponse.data : r
                ),
            }))
        } catch (error) {
            console.error(error)
        }
    },

    updateRoomSeatsBatch: async (roomId, seats) => {
        try {
            await roomService.updateRoomSeats(roomId, seats)
            set((state) => ({
                rooms: state.rooms.map((room) => {
                    if (room.id !== roomId) return room
                    // Create update map
                    const updates = new Map(seats.map(s => [s.id, s.isActive]))
                    return {
                        ...room,
                        seats: room.seats.map(seat =>
                            updates.has(seat.id) ? { ...seat, isActive: updates.get(seat.id)! } : seat
                        )
                    }
                }),
            }))
        } catch (error: any) {
            set({ error: error.message })
            console.error(error)
        }
    },
}))
