/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base-bg': '#121212',
        'secondary-bg': '#2A2A2A',
        'soft-peach': '#F4B6A6',
        'gold': '#D4AF37',
      },
    },
  },
  plugins: [],
}
