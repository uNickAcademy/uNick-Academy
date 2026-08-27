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

/**
 * Niektóre rodziny chcą jednocześnie grupowo i indywidualnie (albo wahają się
 * między lokalizacjami) — tryb i forma zajęć są więc zestawami wyboru, nie
 * pojedynczą wartością. Forma zajęć to suma list obu zaznaczonych trybów
 * (bez duplikatów): „Online” i „W Rumianku” występują w obu, więc przy
 * zaznaczeniu obu trybów i tak pokazują się raz.
 */
export function formatOptionsFor(modes: readonly string[]) {
  const seen = new Set<string>()
  const combined: Option[] = []
  const lists = [
    modes.includes('individual') ? individualFormatOptions : [],
    modes.includes('group') ? groupFormatOptions : [],
  ]
  for (const list of lists) {
    for (const option of list) {
      if (!seen.has(option.value)) {
        seen.add(option.value)
        combined.push(option)
      }
    }
  }
  return combined
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

export function optionValues(options: readonly Option[]): string[] {
  return options.map((option) => option.value)
}

/** Czy każda z `values` (zaznaczonych checkboxów) jest jedną z `options`. */
export function isSubsetOf(options: readonly Option[], values: readonly string[]): boolean {
  const allowed = new Set(optionValues(options))
  return values.every((value) => allowed.has(value))
}

export const MIN_AGE = 2
export const MAX_AGE = 99
