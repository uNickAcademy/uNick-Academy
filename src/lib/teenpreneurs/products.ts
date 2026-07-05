// ─────────────────────────────────────────────────────────────
// Teenpreneurs commerce config — the single place to change
// prices, add products, add currencies or adjust the offer.
// Amounts are in minor units (grosze / cents).
// PLACEHOLDER prices are marked; confirm before launch.
// ─────────────────────────────────────────────────────────────

export type TpCurrency = 'pln' | 'eur'

export type TpVariant = {
  id: string
  /** Translation key under dict.shop.variants */
  labelKey: 'physical' | 'digital'
  prices: Record<TpCurrency, number>
  requiresShipping: boolean
  /** Object path inside the private 'tp-downloads' Supabase bucket (digital only) */
  storagePath?: string
}

export type TpProduct = {
  slug: string
  /** Translation key under dict.shop.products */
  copyKey: 'journal' | 'shameless'
  variants: TpVariant[]
}

export const TP_PRODUCTS: TpProduct[] = [
  {
    slug: 'teenpreneur-journal',
    copyKey: 'journal',
    variants: [
      {
        id: 'journal-physical',
        labelKey: 'physical',
        prices: { pln: 12900, eur: 2900 }, // PLACEHOLDER — confirm price
        requiresShipping: true,
      },
      {
        id: 'journal-digital',
        labelKey: 'digital',
        prices: { pln: 5900, eur: 1400 }, // PLACEHOLDER — confirm price
        requiresShipping: false,
        storagePath: 'journal/teenpreneur-journal.pdf',
      },
    ],
  },
  {
    slug: 'shameless-benevolence',
    copyKey: 'shameless',
    variants: [
      {
        id: 'shameless-digital',
        labelKey: 'digital',
        prices: { pln: 4900, eur: 1200 }, // PLACEHOLDER — confirm price
        requiresShipping: false,
        storagePath: 'shameless/shameless-benevolence.pdf',
      },
    ],
  },
]

export const TP_ENROLMENT = {
  founding: { pln: 149000, eur: 34900 } as Record<TpCurrency, number>,
  standard: { pln: 219000, eur: 49900 } as Record<TpCurrency, number>, // PLACEHOLDER — confirm
  /** Founding offer ends (inclusive), shown on Home + Enrol */
  offerDeadline: '2026-08-17',
  ageTracks: ['13-15', '16-19'] as const,
  /** Translation keys under dict.enrol.slots */
  timeSlots: ['tue-1730', 'wed-1730', 'sat-1000'] as const,
}

export const TP_EVENT = {
  slug: 'first-real-project-with-ai',
  /** 18 August, 18:00 CET (CEST in summer) */
  dateISO: '2026-08-18T18:00:00+02:00',
}

/** Countries we can ship the physical journal to (Stripe Checkout). */
export const TP_SHIPPING_COUNTRIES = [
  'PL', 'DE', 'CZ', 'SK', 'AT', 'NL', 'BE', 'FR', 'ES', 'PT', 'IT',
  'IE', 'DK', 'SE', 'FI', 'NO', 'LT', 'LV', 'EE', 'GB', 'UA', 'US', 'CA',
]

// ── Helpers ──────────────────────────────────────────────────

export function currencyForLocale(locale: string): TpCurrency {
  return locale === 'pl' ? 'pln' : 'eur'
}

export function formatTpPrice(minor: number, currency: TpCurrency, locale: string): string {
  return new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-IE', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100)
}

export function findProduct(slug: string): TpProduct | undefined {
  return TP_PRODUCTS.find(p => p.slug === slug)
}

export function findVariant(variantId: string): { product: TpProduct; variant: TpVariant } | undefined {
  for (const product of TP_PRODUCTS) {
    const variant = product.variants.find(v => v.id === variantId)
    if (variant) return { product, variant }
  }
  return undefined
}
