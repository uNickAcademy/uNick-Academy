/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed',
        navy: {
          DEFAULT: '#1e1b4b',
          50: '#E8EBF0',
          100: '#C5CCDA',
          200: '#9DAAB8',
          300: '#748898',
          400: '#4E6478',
          500: '#1C2B4A',
          600: '#172440',
          700: '#111B32',
          800: '#0C1225',
          900: '#060A15',
        },
        brand: {
          red: '#C0392B',
          green: '#27AE60',
          amber: '#E67E22',
          cream: '#FAF7F2',
          muted: '#F0EDE8',
          subtle: '#7B8FA1',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(28 43 74 / 0.08), 0 1px 2px -1px rgb(28 43 74 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(28 43 74 / 0.12)',
      },
    },
  },
  plugins: [],
}