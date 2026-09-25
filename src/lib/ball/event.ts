/**
 * The uNickorn Ball — jedno źródło prawdy o wydarzeniu.
 *
 * Formularz, walidacja po stronie serwera i mail z danymi do wpłaty liczą
 * kwoty z tych samych stałych. Gdyby ceny siedziały w trzech miejscach, dość
 * jednej literówki, żeby gość zobaczył na stronie inną kwotę niż tę, którą
 * dostaje do przelewu.
 *
 * Dane organizatora pochodzą z `foundationConfig` w app/lib/site-config.js
 * (Fundacja, nie spółka uNick Academy) i nie są tu powtarzane.
 */

export const BALL = {
  name: 'The uNickorn Ball',
  subtitle: 'Magiczny Bal Charytatywny',
  dateLabel: '27 listopada 2026',
  dateISO: '2026-11-27',
  timeLabel: '19:00 – 2:00',
  endISO: '2026-11-28T02:00:00+01:00',
  startISO: '2026-11-27T19:00:00+01:00',
  venue: 'Hotel 500',
  venueDetail: 'sala bankietowa na pierwszym piętrze',
  city: 'Tarnowo Podgórne',
  /** Wersja regulaminu zapisywana przy zgłoszeniu — patrz stopka PDF-a. */
  termsVersion: '2026-09-25',
  termsPath: '/foundation/regulamin-unickorn-ball-2026.pdf',
  posterPath: '/foundation/unickorn-ball-2026.webp',
  contactEmail: 'hello@unick-academy.pl',
} as const

/** Rodzaje biletów. `seats` mnoży się przez liczbę sztuk. */
export const TICKETS = {
  single: { label: 'Bilet dla jednej osoby', price: 300, seats: 1 },
  couple: { label: 'Bilet dla pary', price: 550, seats: 2 },
} as const

export type TicketKind = keyof typeof TICKETS

/** Ile biletów jednego rodzaju wolno wziąć w jednym zgłoszeniu. */
export const MAX_PER_KIND = 20

/**
 * Po przekroczeniu tylu zgłoszonych miejsc Fundacja dostaje maila.
 * Liczymy miejsca, nie zgłoszenia: bilet dla pary to dwoje uczestników.
 * Wysyłka idzie raz — pilnuje tego klucz główny w `ball_milestones`.
 */
export const SEATS_MILESTONE = 100

export const PAYMENT = {
  recipient: 'UNICK ACADEMY FOUNDATION',
  /** Rachunek Fundacji, nie spółki. */
  iban: '76 1090 1362 0000 0001 6663 0458',
  deadlineHours: 48,
} as const

export type TicketCounts = { single: number; couple: number }

/** Liczba miejsc i kwota dla wybranych biletów. Jedyne miejsce, które to liczy. */
export function summarise(counts: TicketCounts): { seats: number; amount: number } {
  return {
    seats: counts.single * TICKETS.single.seats + counts.couple * TICKETS.couple.seats,
    amount: counts.single * TICKETS.single.price + counts.couple * TICKETS.couple.price,
  }
}

/** „1 × bilet dla jednej osoby, 2 × bilet dla pary" — do maila i do panelu. */
export function ticketSummary(counts: TicketCounts): string {
  const parts: string[] = []
  if (counts.single > 0) parts.push(`${counts.single} × bilet dla jednej osoby`)
  if (counts.couple > 0) parts.push(`${counts.couple} × bilet dla pary`)
  return parts.join(', ')
}

/** Tytuł przelewu — ten sam w mailu i w panelu, żeby nikt go nie improwizował. */
export function transferTitle(reference: string, contactName: string): string {
  return `${BALL.name} – ${reference} – ${contactName}`
}
