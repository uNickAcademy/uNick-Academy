/**
 * Ujednolicone wyszukiwanie firmy po NIP.
 * Kolejność: GUS (jeśli jest klucz — bogatszy, ustrukturyzowany adres) →
 * fallback na białą listę MF (darmowa, bez klucza). Dzięki temu wyszukiwarka
 * NIP działa od razu, a po dodaniu GUS_API_KEY korzysta z pełniejszego źródła.
 */

import { isGusConfigured, lookupByNip, type GusCompany } from './client'
import { lookupByNipMF } from './mf'

export type CompanyLookup = GusCompany & { source: 'GUS' | 'MF' }

// NIP można sprawdzić zawsze — MF nie wymaga klucza
export function isNipLookupAvailable(): boolean {
  return true
}

export async function lookupCompanyByNip(nip: string): Promise<CompanyLookup> {
  if (isGusConfigured()) {
    try {
      return { ...(await lookupByNip(nip)), source: 'GUS' }
    } catch {
      // GUS bywa niedostępny (przerwy techniczne) — spróbuj MF
    }
  }
  return { ...(await lookupByNipMF(nip)), source: 'MF' }
}
