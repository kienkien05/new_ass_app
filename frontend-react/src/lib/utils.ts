import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format currency in VND
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount)
}

/**
 * Format date in Vietnamese locale
 */
export function formatDate(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!date) return 'Chưa xác định'
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Chưa xác định'

    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
    }
    return new Intl.DateTimeFormat('vi-VN', defaultOptions).format(d)
}

/**
 * Format relative time (e.g., "2 ngày trước")
 */
export function formatRelativeTime(date: string | Date): string {
    const now = new Date()
    const then = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    const intervals = [
        { label: 'năm', seconds: 31536000 },
        { label: 'tháng', seconds: 2592000 },
        { label: 'tuần', seconds: 604800 },
        { label: 'ngày', seconds: 86400 },
        { label: 'giờ', seconds: 3600 },
        { label: 'phút', seconds: 60 },
    ]

    for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds)
        if (count >= 1) {
            return `${count} ${interval.label} trước`
        }
    }

    return 'Vừa xong'
}

/**
 * Slugify text
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-')
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text
    return text.slice(0, length) + '...'
}

/**
 * Check if running in browser
 */
export const isBrowser = typeof window !== 'undefined'

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}
