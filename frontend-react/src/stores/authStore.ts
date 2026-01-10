import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthResponse } from '@/types'

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    login: (data: AuthResponse) => void
    logout: () => void
    updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: (data: AuthResponse) => {
                set({
                    user: {
                        id: data.id,
                        email: data.email,
                        full_name: data.full_name,
                        role: data.role,
                        avatar_url: data.avatar_url,
                        created_at: new Date().toISOString(),
                        phone_number: data.phone_number,
                        facebook_url: data.facebook_url,
                        gender: data.gender,
                        address: data.address,
                        date_of_birth: data.date_of_birth,
                    },
                    token: data.token,
                    isAuthenticated: true,
                })
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                })
            },

            updateUser: (userData: Partial<User>) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                }))
            },
        }),
        {
            name: 'evient-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
