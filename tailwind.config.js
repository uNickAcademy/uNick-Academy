/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/academy/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        navy: '#1C2B4A',
        'navy-bright': '#2E4577',
        sky: '#38BDF8',
        brand: '#C0392B',
        'brand-bright': '#E2543F',
        'brand-soft': '#F7E2DD',
        'warm-white': '#FFFDF9',
        cream: '#FAF4EC',
        'cream-deep': '#F4EBDD',
        sand: '#ECDFC9',
        ink: '#25303F',
        'ink-soft': '#4E5867',
        muted: '#767F8C',
        'ui-border': '#E7DFD2',
      },
      fontFamily: {
        heading: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '24px',
      },
      boxShadow: {
        'soft': '0 20px 60px -28px rgba(28, 43, 74, 0.28)',
        'card': '0 14px 40px -20px rgba(28, 43, 74, 0.18)',
      },
    },
  },
  plugins: [],
}
