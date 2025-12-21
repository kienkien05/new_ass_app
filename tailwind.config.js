/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./frontend/**/*.{html,js}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Primary Brand
                "primary": "#1c1cf2",
                "primary-hover": "#1650C4",
                "primary-light": "rgba(28, 100, 242, 0.1)",

                // Backgrounds
                "background-light": "#f5f5f8",
                "background-dark": "#101022",

                // Surfaces
                "surface-dark": "#1a1a2e",
                "surface-light": "#ffffff",

                // Inputs
                "input-dark": "#222249",
                "input-light": "#eaeaef",

                // Typography / Neutrals
                "text-secondary": "#9090cb", // Dark mode secondary
                "text-secondary-light": "#64748B",
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
