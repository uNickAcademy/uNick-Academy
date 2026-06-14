/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1C2B4A',
        sky: '#38BDF8',
        brand: '#C0392B',
      },
      fontFamily: {
        heading: ['var(--font-poppins)', 'sans-serif'],
        body: ['var(--font-lora)', 'serif'],
      },
    },
  },
  plugins: [],
}
