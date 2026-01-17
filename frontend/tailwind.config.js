/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c5ff',
          400: '#8aa3ff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4451b8',
          800: '#343c94',
          900: '#252b6b',
        },
        purple: {
          500: '#764ba2',
          600: '#643d8a',
          700: '#532f73',
        },
      },
    },
  },
  plugins: [],
}
