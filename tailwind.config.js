/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#070a0e',
          900: '#0b1118',
          800: '#141d26',
          700: '#222f3e',
        },
        neon: {
          green: '#22c55e',
          glow: '#4ade80',
          yellow: '#eab308'
        }
      }
    },
  },
  plugins: [],
}