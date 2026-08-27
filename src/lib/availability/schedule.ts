// ============================================================
// Formularz dostępności na rok szkolny 2026/2027 (tymczasowy).
//
// Wspólne stałe i czyste funkcje używane po obu stronach: przez
// komponenty klienckie (suwaki, walidacja „na żywo”) i przez
// endpoint /api/availability (walidacja właściwa + spłaszczenie
// dostępności do jednego pola tekstowego dla arkusza).
//
// USUWANIE PO ZAKOŃCZENIU NABORU: patrz docs/FORMULARZ-DOSTEPNOSCI.md.
// ============================================================

/** Dolna i górna granica suwaka (minuty od północy): 6:00 – 22:00. */
export const MIN_MINUTES = 6 * 60
export const MAX_MINUTES = 22 * 60
/** Dokładność zaznaczania — kwadrans. */
export const STEP_MINUTES = 15
/** Najkrótszy możliwy przedział; pilnuje, by uchwyty się nie minęły. */
export const MIN_SLOT_MINUTES = STEP_MINUTES
/** Ile przedziałów dziennie ma sens (zabezpieczenie przed spamem). */
export const MAX_SLOTS_PER_DAY = 4

/** Domyślny przedział nowo dodanego suwaka: popołudnie po szkole. */
export const DEFAULT_SLOT = { start: 16 * 60, end: 18 * 60 } as const

export type DayKey =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday'

export type TimeSlot = { start: number; end: number }
export type DayAvailability = { day: DayKey; slots: TimeSlot[] }

export const DAYS: readonly { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Poniedziałek' },
  { key: 'tuesday', label: 'Wtorek' },
  { key: 'wednesday', label: 'Środa' },
  { key: 'thursday', label: 'Czwartek' },
  { key: 'friday', label: 'Piątek' },
  { key: 'saturday', label: 'Sobota' },
  { key: 'sunday', label: 'Niedziela' },
] as const

const DAY_LABELS: Record<string, string> = Object.fromEntries(DAYS.map((d) => [d.key, d.label]))

/** "8:00", "16:30" — bez zera wiodącego, tak jak zapisujemy godziny po polsku. */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours}:${String(rest).padStart(2, '0')}`
}

/** "16:00 do 18:30" — podpis nad suwakiem i cegiełka spłaszczonego tekstu. */
export function formatSlot(slot: TimeSlot): string {
  return `${formatTime(slot.start)} do ${formatTime(slot.end)}`
}

/** Przyciąga dowolną wartość do kwadransa wewnątrz zakresu 6:00–22:00. */
export function snapToStep(minutes: number): number {
  const clamped = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, minutes))
  return Math.round((clamped - MIN_MINUTES) / STEP_MINUTES) * STEP_MINUTES + MIN_MINUTES
}

export function isValidSlot(slot: TimeSlot): boolean {
  return (
    Number.isInteger(slot.start) &&
    Number.isInteger(slot.end) &&
    slot.start >= MIN_MINUTES &&
    slot.end <= MAX_MINUTES &&
    slot.end - slot.start >= MIN_SLOT_MINUTES &&
    (slot.start - MIN_MINUTES) % STEP_MINUTES === 0 &&
    (slot.end - MIN_MINUTES) % STEP_MINUTES === 0
  )
}

export function countSlots(availability: DayAvailability[]): number {
  return availability.reduce((total, day) => total + day.slots.length, 0)
}

/**
 * Spłaszcza dostępność do JEDNEJ komórki arkusza:
 * "Poniedziałek: 8:00 do 10:00 oraz 16:00 do 18:00; Środa: 16:00 do 18:00".
 * Zapier mapuje to 1:1 na kolumnę „dostępność” — bez zagnieżdżeń.
 */
export function formatAvailability(availability: DayAvailability[]): string {
  return availability
    .filter((day) => day.slots.length > 0)
    .map((day) => {
      const label = DAY_LABELS[day.day] ?? day.day
      const slots = day.slots.map(formatSlot).join(' oraz ')
      return `${label}: ${slots}`
    })
    .join('; ')
}
