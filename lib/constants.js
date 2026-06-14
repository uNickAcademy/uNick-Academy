export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export const AGE_GROUPS = [
  { value: 'young_learners', label: 'Young learners' },
  { value: 'teens', label: 'Teens' },
  { value: 'adults', label: 'Adults' },
]

export const SKILLS = [
  'grammar',
  'vocabulary',
  'speaking',
  'listening',
  'reading',
  'writing',
  'pronunciation',
]

export const CURRENCIES = ['usd', 'eur', 'pln']

export const CURRENCY_SYMBOLS = {
  usd: '$',
  eur: '€',
  pln: 'zł',
}

// Headline monthly/annual prices per currency. These are the amounts shown
// on the pricing page and must match the Stripe Price objects referenced by
// PRICE_ID_ENV_KEYS below (see scripts/setup-stripe.js).
export const PRICES = {
  monthly: { usd: 6, eur: 5, pln: 20 },
  annual: { usd: 60, eur: 50, pln: 200 },
}

// Maps [plan][currency] to the env var holding the Stripe Price ID.
export const PRICE_ID_ENV_KEYS = {
  monthly: {
    usd: 'STRIPE_PRICE_MONTHLY_USD',
    eur: 'STRIPE_PRICE_MONTHLY_EUR',
    pln: 'STRIPE_PRICE_MONTHLY_PLN',
  },
  annual: {
    usd: 'STRIPE_PRICE_ANNUAL_USD',
    eur: 'STRIPE_PRICE_ANNUAL_EUR',
    pln: 'STRIPE_PRICE_ANNUAL_PLN',
  },
}

export function getPriceId(plan, currency) {
  const key = PRICE_ID_ENV_KEYS[plan]?.[currency]
  return key ? process.env[key] : undefined
}

// Best-effort currency guess from a country code (e.g. Vercel's
// x-vercel-ip-country header). Defaults to USD.
const EUR_COUNTRIES = new Set([
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT',
  'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
])

export function currencyForCountry(countryCode) {
  if (!countryCode) return 'usd'
  const code = countryCode.toUpperCase()
  if (code === 'PL') return 'pln'
  if (EUR_COUNTRIES.has(code)) return 'eur'
  return 'usd'
}
