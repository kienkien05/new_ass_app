import { create } from 'zustand'

export interface AppUser {
    id: string
    email: string
    full_name: string
    role: 'user' | 'admin'
    status: 'active' | 'inactive'
    created_at: string
    avatar_url?: string
    phone_number?: string
    facebook_url?: string
    gender?: 'male' | 'female' | 'other'
    address?: string
    date_of_birth?: string
}

// Users will be fetched from API - no mock data
const mockUsers: AppUser[] = []

interface UserStore {
    users: AppUser[]

    getAllUsers: () => AppUser[]
    getUserById: (id: string) => AppUser | undefined
    getUserByEmail: (email: string) => AppUser | undefined
    addUser: (user: Omit<AppUser, 'id' | 'created_at'>) => void
    updateUser: (id: string, data: Partial<AppUser>) => void
    deleteUser: (id: string) => void
    toggleStatus: (id: string) => void

    // Check if email already exists (for registration validation)
    emailExists: (email: string) => boolean
}

export const useUserStore = create<UserStore>((set, get) => ({
    users: mockUsers,

    getAllUsers: () => get().users,

    getUserById: (id: string) => get().users.find(u => u.id === id),

    getUserByEmail: (email: string) => get().users.find(u => u.email === email),

    addUser: (userData) => {
        const newUser: AppUser = {
            ...userData,
            id: `user${Date.now()}`,
            created_at: new Date().toISOString().split('T')[0],
        }
        set((state) => ({ users: [...state.users, newUser] }))
    },

    updateUser: (id, data) => {
        set((state) => ({
            users: state.users.map((u) => u.id === id ? { ...u, ...data } : u),
        }))
    },

    deleteUser: (id) => {
        set((state) => ({
            users: state.users.filter((u) => u.id !== id),
        }))
    },

    toggleStatus: (id) => {
        set((state) => ({
            users: state.users.map((u) =>
                u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
            ),
        }))
    },

    emailExists: (email: string) => {
        return get().users.some(u => u.email.toLowerCase() === email.toLowerCase())
    },
}))
