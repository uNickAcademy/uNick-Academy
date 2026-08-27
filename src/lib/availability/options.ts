// Listy wyboru formularza dostępności. Wartości (`value`) jadą po drucie,
// etykiety (`label`) trafiają do arkusza — dlatego mapowanie żyje w jednym
// miejscu i jest współdzielone przez formularz i endpoint.

const o = (value: string, label: string) => ({ value, label })

export const levelOptions = [
  o('unknown', 'Nie wiem'),
  o('beginner', 'Początkujący'),
  o('intermediate', 'Średnio zaawansowany'),
  o('advanced', 'Zaawansowany'),
] as const

export const modeOptions = [
  o('group', 'Grupowo'),
  o('individual', 'Indywidualnie'),
] as const

/** „Forma zajęć” zależy od trybu — stąd dwie osobne listy. */
export const individualFormatOptions = [
  o('online', 'Online'),
  o('rumianek', 'W Rumianku'),
  o('travel', 'Z dojazdem'),
] as const

export const groupFormatOptions = [
  o('online', 'Online'),
  o('rumianek', 'W Rumianku'),
  o('school', 'W szkole dziecka'),
] as const

export type Mode = 'group' | 'individual'

export function formatOptionsFor(mode: string) {
  return mode === 'individual' ? individualFormatOptions : groupFormatOptions
}

/** „Z dojazdem” dopytuje o adres, „W szkole dziecka” o szkołę i miejscowość. */
export const FORMAT_NEEDING_ADDRESS = 'travel'
export const FORMAT_NEEDING_SCHOOL = 'school'

type Option = { value: string; label: string }

export function labelOf(options: readonly Option[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? ''
}

export function isOption(options: readonly Option[], value: string): boolean {
  return options.some((option) => option.value === value)
}

export const MIN_AGE = 2
export const MAX_AGE = 99
