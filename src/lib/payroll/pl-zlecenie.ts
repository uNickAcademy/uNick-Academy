/**
 * Szacunkowe wyliczenie wypłaty netto dla lektorów wg typu umowy.
 *
 * WAŻNE: to jest orientacyjny kalkulator, nie zastępuje księgowej/kadrowej.
 * Zakłada standardowy, najczęstszy przypadek umowy zlecenia: zlecenie jest
 * jedynym tytułem do ubezpieczeń, bez dobrowolnego chorobowego, 20% kosztów
 * uzyskania przychodu, bez miesięcznego stosowania kwoty wolnej (PIT-2).
 * Realna wypłata może się różnić (inny etat, PIT-2 złożony u zleceniodawcy,
 * 50% KUP przy przeniesieniu praw autorskich, limit 30-krotności ZUS, itp.).
 * Stawki (rok 2026) trzymane w jednym miejscu, żeby księgowa mogła je łatwo
 * zaktualizować.
 */

import type { TeacherContractType } from '@/types'

// Stawki ZUS i podatkowe — do weryfikacji/aktualizacji przez księgową co roku.
export const RATES = {
  zusEmerytalna: 0.0976,
  zusRentowa: 0.015,
  skladkaZdrowotna: 0.09,
  zdrowotnaOdliczenieOdPodatku: 0.0775,
  kosztyUzyskania: 0.20,
  pit: 0.12,
} as const

export interface PayoutBreakdown {
  contractType: TeacherContractType
  gross: number
  zusSocial: number
  healthContribution: number
  pitAdvance: number
  net: number
  /** Ludzki opis, do wyświetlenia lektorowi/adminowi */
  note: string
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Wylicza wypłatę netto z kwoty brutto wg typu umowy.
 * - b2b: lektor sam wystawia fakturę i rozlicza podatki — wypłata = 100% brutto.
 * - zlecenie_student: uczeń/student do 26 rż na zleceniu — ustawowo zwolniony
 *   z PIT ("zero PIT dla młodych") i ze składek ZUS — wypłata = 100% brutto.
 * - zlecenie: standardowe potrącenia ZUS + zaliczka PIT wg wzoru wyżej.
 */
export function calculateNetPayout(gross: number, contractType: TeacherContractType): PayoutBreakdown {
  if (gross <= 0) {
    return { contractType, gross: 0, zusSocial: 0, healthContribution: 0, pitAdvance: 0, net: 0, note: '' }
  }

  if (contractType === 'b2b') {
    return {
      contractType, gross: round2(gross), zusSocial: 0, healthContribution: 0, pitAdvance: 0, net: round2(gross),
      note: 'B2B — lektor wystawia fakturę, sam rozlicza podatek i ZUS.',
    }
  }

  if (contractType === 'zlecenie_student') {
    return {
      contractType, gross: round2(gross), zusSocial: 0, healthContribution: 0, pitAdvance: 0, net: round2(gross),
      note: 'Zlecenie — uczeń/student do 26 rż: zwolnienie z PIT i ZUS.',
    }
  }

  // Standardowa umowa zlecenie
  const zusSocial = round2(gross * (RATES.zusEmerytalna + RATES.zusRentowa))
  const healthBase = gross - zusSocial
  const healthContribution = round2(healthBase * RATES.skladkaZdrowotna)
  const kup = healthBase * RATES.kosztyUzyskania
  const taxBase = Math.round(healthBase - kup) // podstawa opodatkowania, zaokrąglona do pełnych złotych
  const healthDeduction = Math.round(healthBase * RATES.zdrowotnaOdliczenieOdPodatku)
  const pitAdvance = Math.max(0, Math.round(taxBase * RATES.pit) - healthDeduction)
  const net = round2(gross - zusSocial - healthContribution - pitAdvance)

  return {
    contractType, gross: round2(gross), zusSocial, healthContribution, pitAdvance, net,
    note: 'Umowa zlecenie — szacunkowe potrącenie ZUS i zaliczki PIT (patrz zastrzeżenie).',
  }
}

export const CONTRACT_TYPE_LABELS: Record<TeacherContractType, string> = {
  b2b: 'B2B (faktura)',
  zlecenie: 'Umowa zlecenie',
  zlecenie_student: 'Zlecenie — uczeń/student do 26 rż',
}
