import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
    theme: 'light' | 'dark'
    setTheme: (theme: 'light' | 'dark') => void
    toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'light',
            setTheme: (theme) => {
                set({ theme })
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
            },
            toggleTheme: () => {
                const currentTheme = get().theme
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
                get().setTheme(newTheme)
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                if (state?.theme === 'dark') {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
            }
        }
    )
)
