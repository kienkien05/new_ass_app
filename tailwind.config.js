/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./frontend/**/*.{html,js}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Primary Brand (keeping blue accent)
                "primary": "#3b82f6",           // blue-500
                "primary-hover": "#2563eb",     // blue-600
                "primary-light": "rgba(59, 130, 246, 0.1)",

                // Backgrounds - Shadcn Zinc
                "background-light": "#fafafa",  // zinc-50
                "background-dark": "#09090b",   // zinc-950

                // Surfaces/Cards - Shadcn Zinc
                "surface-light": "#ffffff",
                "surface-dark": "#18181b",      // zinc-900

                // Muted/Secondary - Shadcn Zinc
                "muted-dark": "#27272a",        // zinc-800
                "muted-light": "#f4f4f5",       // zinc-100

                // Borders - Shadcn Zinc
                "border-dark": "#27272a",       // zinc-800
                "border-light": "#e4e4e7",      // zinc-200

                // Inputs - Shadcn Zinc  
                "input-dark": "#27272a",        // zinc-800
                "input-light": "#e4e4e7",       // zinc-200

                // Typography / Neutrals - Shadcn Zinc
                "text-secondary": "#71717a",    // zinc-500
                "text-muted": "#a1a1aa",        // zinc-400

                // Accent colors
                "accent-dark": "#3f3f46",       // zinc-700
                "accent-light": "#f4f4f5",      // zinc-100
            },
            fontFamily: {
                "display": ["Be Vietnam Pro", "sans-serif"],
                "body": ["Be Vietnam Pro", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "1rem",
                "xl": "1.5rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
}
