import api from './api'

export interface Banner {
    id: string
    title: string
    image_url: string
    link_url: string
    event_id?: string
    is_active: boolean
    is_homepage: boolean
    order: number
}

interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
}

export const bannerService = {
    getBanners: async (): Promise<Banner[]> => {
        const response = await api.get<ApiResponse<Banner[]>>('/banners')
        return response.data.data
    },

    getPublicBanners: async (): Promise<Banner[]> => {
        const response = await api.get<ApiResponse<Banner[]>>('/banners/public')
        return response.data.data
    },

    createBanner: async (data: Partial<Banner>): Promise<Banner> => {
        const response = await api.post<ApiResponse<Banner>>('/banners', data)
        return response.data.data
    },

    updateBanner: async (id: string, data: Partial<Banner>): Promise<Banner> => {
        const response = await api.put<ApiResponse<Banner>>(`/banners/${id}`, data)
        return response.data.data
    },

    deleteBanner: async (id: string): Promise<void> => {
        await api.delete(`/banners/${id}`)
    },

    toggleBanner: async (id: string): Promise<Banner> => {
        const response = await api.patch<ApiResponse<Banner>>(`/banners/${id}/toggle`)
        return response.data.data
    },
}
