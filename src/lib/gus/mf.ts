/**
 * Wyszukiwanie firmy po NIP przez API „Biała lista podatników VAT" Ministerstwa
 * Finansów (https://wl-api.mf.gov.pl). Publiczne, DARMOWE i BEZ KLUCZA — działa
 * od razu. Zwraca nazwę, REGON i adres. Uzupełnia/zastępuje GUS (BIR), który
 * wymaga rejestracji po klucz.
 */

import type { GusCompany } from './client'

const MF_BASE = 'https://wl-api.mf.gov.pl'

function todayISO(): string {
  // MF wymaga daty (na jaki dzień sprawdzamy status) w formacie YYYY-MM-DD
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Rozbija adres MF ("UL. PRZYKŁADOWA 1/2, 00-950 WARSZAWA") na części
function parseAddress(raw?: string | null): GusCompany['address'] {
  const out: GusCompany['address'] = { street: null, city: null, postal_code: null, country: 'Polska' }
  if (!raw) return out
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 1) out.street = parts[0] || null
  const tail = parts.slice(1).join(', ')
  const postal = tail.match(/\d{2}-\d{3}/)
  if (postal) out.postal_code = postal[0]
  const city = tail.replace(/\d{2}-\d{3}/, '').replace(/,/g, '').trim()
  if (city) out.city = city
  return out
}

export async function lookupByNipMF(nip: string): Promise<GusCompany> {
  const cleanNip = nip.replace(/[^0-9]/g, '')
  if (cleanNip.length !== 10) throw new Error('Podaj poprawny NIP (10 cyfr)')

  const url = `${MF_BASE}/api/search/nip/${cleanNip}?date=${todayISO()}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (res.status === 400) throw new Error('Nieprawidłowy NIP')
  if (!res.ok) throw new Error(`Biała lista MF: błąd ${res.status}`)

  const json = await res.json() as {
    result?: { subject?: {
      name?: string; nip?: string; regon?: string
      workingAddress?: string; residenceAddress?: string
    } | null }
  }
  const subject = json?.result?.subject
  if (!subject) throw new Error('Nie znaleziono firmy o podanym NIP na białej liście MF')

  return {
    name: (subject.name ?? '').trim(),
    nip: subject.nip ?? cleanNip,
    regon: subject.regon ?? null,
    address: parseAddress(subject.workingAddress || subject.residenceAddress),
  }
}
