import api from './api'

interface UploadResponse {
    status: string
    imagePath: string
}

export const uploadService = {
    uploadImage: async (file: File) => {
        const formData = new FormData()
        formData.append('image', file)

        const response = await api.post<UploadResponse>('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    }
}
