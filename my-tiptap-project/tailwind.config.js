/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
      },
      colors: {
        error: '#dc2626',
        warning: '#f59e0b',
        success: '#16a34a',
        info: '#3b82f6',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}