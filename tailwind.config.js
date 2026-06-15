/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scoped to uNick Teachers Academy only - the marketing site under
  // app/[locale] has its own hand-written CSS and must not be affected.
  content: ['./app/academy/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    // Disable Tailwind's base reset so it doesn't leak into the rest of
    // the app (shared root layout/body).
    preflight: false,
  },
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
