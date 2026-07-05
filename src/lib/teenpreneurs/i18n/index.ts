import en from './en'

// The English dictionary defines the shape; other locales must match it,
// which keeps translations complete by construction (tsc fails on gaps).
export type TpDictionary = typeof en
export type TpLocale = 'en' | 'pl'

export const tpLocales: TpLocale[] = ['en', 'pl']
export const tpDefaultLocale: TpLocale = 'en'

// Synchronous on purpose, mirroring the main site's dictionary pattern —
// client components (header, cart, forms) read strings without awaiting.
import pl from './pl'
const dictionaries: Record<TpLocale, TpDictionary> = { en, pl }

export function getTpDictionary(locale: string): TpDictionary {
  return dictionaries[locale as TpLocale] ?? dictionaries[tpDefaultLocale]
}

export function isTpLocale(value: string): value is TpLocale {
  return (tpLocales as string[]).includes(value)
}
