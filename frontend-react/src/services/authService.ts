import api from './api'
import type { ApiResponse, AuthResponse } from '@/types'

interface LoginCredentials {
    email: string
    password: string
}

interface RegisterCredentials {
    email: string
    password: string
    full_name: string
}

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials)
        return response.data.data
    },

    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', credentials)
        return response.data.data
    },

    getProfile: async (): Promise<AuthResponse> => {
        const response = await api.get<ApiResponse<AuthResponse>>('/auth/me')
        return response.data.data
    },
}
