/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Abril Fatface"', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        teal: { primary: '#00B4B4' },
        purple: { soft: '#A855F7' },
        emerald: { success: '#10B981' },
        crimson: { leak: '#EF4444' },
      }
    },
  },
  plugins: [],
}
