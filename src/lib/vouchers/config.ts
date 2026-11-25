export const VOUCHER_TERMS_VERSION = 'bf2026-v1'
export const SALES_START = Date.parse('2026-11-26T00:00:00+01:00')
export const SALES_END = Date.parse('2026-12-01T00:00:00+01:00')
export const VOUCHER_ORIGIN = 'https://unick-academy.pl'

export const VOUCHER_OFFERS = [
  { value: 250, cash: 23900, bonus: 1100, face: 25000 },
  { value: 500, cash: 44900, bonus: 5100, face: 50000 },
  { value: 1000, cash: 84900, bonus: 15100, face: 100000 },
  { value: 5000, cash: 399900, bonus: 100100, face: 500000 },
] as const

export function offerFor(value: number) {
  return VOUCHER_OFFERS.find(offer => offer.value === value)
}

export function salesWindow(now = Date.now()): 'before' | 'open' | 'after' {
  return now < SALES_START ? 'before' : now < SALES_END ? 'open' : 'after'
}

export function configurationReady() {
  return (process.env.VOUCHER_ACCESS_SECRET?.trim().length ?? 0) >= 40 &&
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') === 'https://xkydfgunafxfuzsggmca.supabase.co' &&
    ['PAYU_POS_ID', 'PAYU_CLIENT_ID', 'PAYU_CLIENT_SECRET', 'PAYU_SECOND_KEY',
    'VOUCHER_ACCESS_SECRET', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL',
    'RESEND_API_KEY'].every(key => Boolean(process.env[key]?.trim()))
}

export function salesEnabled(now = Date.now()) {
  return process.env.VOUCHER_SALES_ENABLED === 'true' && configurationReady() && salesWindow(now) === 'open'
}
