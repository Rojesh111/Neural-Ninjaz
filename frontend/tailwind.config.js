/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
            },
            colors: {
                premium: {
                    dark: '#0f172a',
                    card: 'rgba(30, 41, 59, 0.7)',
                    accent: '#38bdf8',
                }
            }
        },
    },
    plugins: [],
}
