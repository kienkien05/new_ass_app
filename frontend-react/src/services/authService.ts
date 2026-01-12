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

// Extended response type for OTP flow
interface OTPRequiredResponse {
    requireOTP: true
    message: string
    data: { email: string }
}

type AuthOrOTPResponse = AuthResponse | OTPRequiredResponse

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthOrOTPResponse> => {
        const response = await api.post<{ success: boolean; requireOTP?: boolean; message?: string; data: any }>('/auth/login', credentials)

        // Check if OTP is required
        if (response.data.requireOTP) {
            return {
                requireOTP: true,
                message: response.data.message || 'OTP required',
                data: response.data.data
            }
        }

        return response.data.data as AuthResponse
    },

    register: async (credentials: RegisterCredentials): Promise<AuthOrOTPResponse> => {
        const response = await api.post<{ success: boolean; requireOTP?: boolean; message?: string; data: any }>('/auth/register', credentials)

        // Check if OTP is required
        if (response.data.requireOTP) {
            return {
                requireOTP: true,
                message: response.data.message || 'OTP required',
                data: response.data.data
            }
        }

        return response.data.data as AuthResponse
    },

    getProfile: async (): Promise<AuthResponse> => {
        const response = await api.get<ApiResponse<AuthResponse>>('/auth/me')
        return response.data.data
    },

    forgotPassword: async (email: string) => {
        return api.post('/auth/forgot-password', { email })
    },

    resetPassword: async (token: string, password: string) => {
        return api.post(`/auth/reset-password/${token}`, { password })
    },
}
