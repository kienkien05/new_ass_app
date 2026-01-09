import { create } from 'zustand'

export interface AppUser {
    id: string
    email: string
    full_name: string
    role: 'user' | 'admin'
    status: 'active' | 'inactive'
    created_at: string
    avatar_url?: string
}

// Mock users data - shared across all pages
const mockUsers: AppUser[] = [
    { id: 'user1', email: 'nguyenvana@gmail.com', full_name: 'Nguyễn Văn A', role: 'user', status: 'active', created_at: '2026-01-01' },
    { id: 'user2', email: 'tranthib@gmail.com', full_name: 'Trần Thị B', role: 'user', status: 'active', created_at: '2026-01-02' },
    { id: 'user3', email: 'levanc@gmail.com', full_name: 'Lê Văn C', role: 'user', status: 'active', created_at: '2026-01-03' },
    { id: 'user4', email: 'phamthid@gmail.com', full_name: 'Phạm Thị D', role: 'user', status: 'active', created_at: '2026-01-04' },
    { id: 'user5', email: 'hoangvane@gmail.com', full_name: 'Hoàng Văn E', role: 'user', status: 'inactive', created_at: '2026-01-05' },
    { id: 'admin1', email: 'admin@evient.com', full_name: 'Admin EViENT', role: 'admin', status: 'active', created_at: '2025-12-01' },
]

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
