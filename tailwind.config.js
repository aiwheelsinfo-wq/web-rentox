/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandBlue: '#008CFF',
        brandAmber: '#FFB300',
        brandCharcoal: '#263238',
        brandBgLight: '#FFFBF0',
      }
    },
  },
  plugins: [],
}
