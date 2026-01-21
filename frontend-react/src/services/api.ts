import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 - clear auth and redirect
        if (error.response?.status === 401) {
            // Don't redirect if it's a login attempt failure
            // This allows the login page to show "Invalid credentials" error
            if (error.config?.url?.includes('/auth/login')) {
                return Promise.reject(error)
            }

            useAuthStore.getState().logout()
            // window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api
