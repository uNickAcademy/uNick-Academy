import * as O from './options'
import {
  DAYS,
  MAX_SLOTS_PER_DAY,
  countSlots,
  isValidSlot,
  type DayAvailability,
  type DayKey,
  type TimeSlot,
} from './schedule'

export type AvailabilitySubmission = {
  parentFirstName: string
  parentLastName: string
  email: string
  phone: string
  learnerType: 'self' | 'child'
  childName: string
  childAge: number | null
  level: string
  mode: string[]
  classFormat: string[]
  address: string
  schoolName: string
  schoolCity: string
  availability: DayAvailability[]
  notes: string
  referralCode: string
}

type Result =
  | { ok: true; data: AvailabilitySubmission }
  | { ok: false; errors: Record<string, string> }

const text = (value: unknown, max = 200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

/** Odsiewa śmieci z zestawu checkboxów (tryb, forma zajęć) — bez duplikatów. */
const stringSet = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim() !== '').map((item) => item.trim()))]
    : []

const DAY_KEYS = new Set<string>(DAYS.map((day) => day.key))

/** Odsiewa śmieci z ciała żądania i porządkuje dni w kolejności tygodnia. */
function parseAvailability(value: unknown): DayAvailability[] {
  if (!Array.isArray(value)) return []
  const byDay = new Map<DayKey, TimeSlot[]>()

  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const { day, slots } = entry as { day?: unknown; slots?: unknown }
    if (typeof day !== 'string' || !DAY_KEYS.has(day) || !Array.isArray(slots)) continue

    const parsed = slots
      .filter((slot): slot is TimeSlot => {
        if (!slot || typeof slot !== 'object') return false
        const { start, end } = slot as { start?: unknown; end?: unknown }
        return typeof start === 'number' && typeof end === 'number' && isValidSlot({ start, end })
      })
      .slice(0, MAX_SLOTS_PER_DAY)
      .sort((a, b) => a.start - b.start)

    if (parsed.length) byDay.set(day as DayKey, parsed)
  }

  return DAYS.filter((day) => byDay.has(day.key)).map((day) => ({
    day: day.key,
    slots: byDay.get(day.key) as TimeSlot[],
  }))
}

export function validateAvailabilitySubmission(input: unknown): Result {
  const values = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const errors: Record<string, string> = {}

  // Pułapka na boty: formularz musi być otwarty choć chwilę przed wysłaniem.
  // Wcześniej stało tu też ukryte pole-pułapka ("website"), ale menedżery
  // haseł i wtyczki do autouzupełniania wypełniały je razem z resztą
  // formularza (widoczne na niebiesko w Chrome), odrzucając prawdziwe
  // zgłoszenia — czas otwarcia nie ma tego problemu.
  const startedAt = Number(values.startedAt)
  if (!startedAt || Date.now() - startedAt < 1500 || Date.now() - startedAt > 86400000) {
    errors.form = 'Odśwież stronę i spróbuj ponownie.'
  }

  const parentFirstName = text(values.parentFirstName, 80)
  const parentLastName = text(values.parentLastName, 80)
  const email = text(values.email, 160)
  const phone = text(values.phone, 40)
  const learnerType = values.learnerType === 'self' || values.learnerType === 'child' ? values.learnerType : null
  const childName = text(values.childName, 80)
  // Wiek pytamy tylko przy „dla dziecka" — przy „dla mnie" nie ma go czym
  // sprawdzać (dorosłych planuje się osobno od grup dziecięcych, więc wiek
  // niczego by nie zmienił), a kolumna w bazie jest teraz na to nullable.
  const childAge = learnerType === 'child' ? Number(values.childAge) : null
  const level = text(values.level, 40)
  const mode = stringSet(values.mode)
  const classFormat = stringSet(values.classFormat)
  const address = text(values.address, 200)
  const schoolName = text(values.schoolName, 160)
  const schoolCity = text(values.schoolCity, 120)
  const notes = text(values.notes, 2000)
  // Wolny tekst, tak samo jak w ConsultationModal — sprawdzany dopiero przy
  // realnym zapisie (register_referral), nie tutaj.
  const referralCode = text(values.referralCode, 40)

  if (!parentFirstName) errors.parentFirstName = 'Podaj imię.'
  if (!parentLastName) errors.parentLastName = 'Podaj nazwisko.'
  if (!email) errors.email = 'Podaj adres e-mail.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Podaj poprawny adres e-mail.'
  if (!phone) errors.phone = 'Podaj numer telefonu.'
  if (!learnerType) errors.learnerType = 'Wybierz, dla kogo są zajęcia.'
  if (!childName) errors.childName = learnerType === 'self' ? 'Podaj imię i nazwisko.' : 'Podaj imię dziecka.'
  if (learnerType === 'child' && (!Number.isInteger(childAge) || (childAge as number) < O.MIN_AGE || (childAge as number) > O.MAX_AGE)) {
    errors.childAge = `Podaj wiek dziecka (${O.MIN_AGE}–${O.MAX_AGE} lat).`
  }
  // Poziom jest opcjonalny — sprawdzamy tylko, czy nie przyszła obca wartość.
  if (level && !O.isOption(O.levelOptions, level)) errors.level = 'Wybierz poziom z listy.'

  if (!mode.length || !O.isSubsetOf(O.modeOptions, mode)) {
    errors.mode = 'Wybierz, czy zajęcia mają być grupowe czy indywidualne (można oba).'
  } else {
    const formatOptions = O.formatOptionsFor(mode)
    if (!classFormat.length || !O.isSubsetOf(formatOptions, classFormat)) {
      errors.classFormat = 'Wybierz przynajmniej jedną formę zajęć.'
    } else {
      // Warunkowe pola dotyczą wyboru niezależnie od tego, ile innych form
      // zaznaczono obok — rodzic mógł zaznaczyć i „Online”, i „Z dojazdem”.
      if (classFormat.includes(O.FORMAT_NEEDING_ADDRESS) && !address) {
        errors.address = 'Podaj adres, pod który mamy dojeżdżać.'
      }
      if (classFormat.includes(O.FORMAT_NEEDING_SCHOOL)) {
        if (!schoolName) errors.schoolName = 'Podaj nazwę szkoły.'
        if (!schoolCity) errors.schoolCity = 'Podaj miejscowość szkoły.'
      }
    }
  }

  const availability = parseAvailability(values.availability)
  if (countSlots(availability) === 0) {
    errors.availability = 'Zaznacz przynajmniej jeden przedział godzinowy w dowolnym dniu.'
  }

  if (values.consent !== true) {
    errors.consent = 'Potrzebujemy zgody na przetwarzanie danych, żeby przyjąć zgłoszenie.'
  }

  if (Object.keys(errors).length) return { ok: false, errors }

  return {
    ok: true,
    data: {
      parentFirstName,
      parentLastName,
      email,
      phone,
      learnerType: learnerType as 'self' | 'child',
      childName,
      childAge,
      level,
      mode,
      classFormat,
      // Pola warunkowe zapisujemy tylko wtedy, gdy naprawdę dotyczą wyboru —
      // inaczej w arkuszu zostałby adres po zmianie zdania w formularzu.
      address: classFormat.includes(O.FORMAT_NEEDING_ADDRESS) ? address : '',
      schoolName: classFormat.includes(O.FORMAT_NEEDING_SCHOOL) ? schoolName : '',
      schoolCity: classFormat.includes(O.FORMAT_NEEDING_SCHOOL) ? schoolCity : '',
      availability,
      notes,
      referralCode,
    },
  }
}
