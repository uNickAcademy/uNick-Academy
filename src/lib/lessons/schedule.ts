// Generator serii lekcji z konfiguracji kursu.
//
// Kurs opisujemy tak, jak układa się grafik na papierze: kilka stałych terminów
// w tygodniu (np. wtorki 12:00 przez 30 min i czwartki 12:15 przez 30 min),
// data początku i końca oraz dni wyłączone (święta, przerwy, pojedyncze
// odwołania). Reszta — konkretne daty lekcji, ich liczba i wartość kursu —
// wynika z tych trzech rzeczy i nie powinna być wpisywana ręcznie.

const TZ = 'Europe/Warsaw'

/** Dni tygodnia w konwencji aplikacji: 0 = poniedziałek … 6 = niedziela. */
export const DAYS_PL = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela']
export const DAYS_PL_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']

export type Slot = {
  /** 0 = poniedziałek … 6 = niedziela */
  day: number
  /** Godzina rozpoczęcia „HH:MM" czasu polskiego. */
  time: string
  /** Długość zajęć w minutach. */
  durationMin: number
}

export type CourseConfig = {
  slots: Slot[]
  /** Pierwszy dzień kursu, „YYYY-MM-DD". */
  startDate: string
  /**
   * Ostatni dzień kursu, „YYYY-MM-DD". Puste = kurs bez wyznaczonego końca
   * (ongoing) — generujemy wtedy terminy do końca bieżącego roku szkolnego
   * (patrz `defaultCourseEndDate`), a admin wydłuża serię później przez
   * ponowne „Zastosuj terminy", tak samo jak dla kursu z datą końca.
   */
  endDate?: string
  /** Dni bez zajęć, „YYYY-MM-DD" — święta, przerwy, odwołania. */
  excludedDates?: string[]
}

export type GeneratedLesson = { startsAt: string; endsAt: string; day: number; time: string }

/**
 * Przesunięcie strefy względem UTC w danej chwili (w minutach).
 * Liczone z Intl, więc zmiana czasu letniego/zimowego wychodzi sama.
 */
function tzOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  // Intl potrafi zwrócić godzinę 24 dla północy — Date.UTC to normalizuje.
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return (asUtc - date.getTime()) / 60000
}

/**
 * Data i godzina czasu polskiego → moment w UTC.
 * Dwa przebiegi, bo przy zmianie czasu offset policzony dla „naiwnej" chwili
 * potrafi być o godzinę inny niż offset właściwego momentu.
 */
export function warsawToUtc(dateStr: string, timeStr: string): Date {
  const naive = new Date(`${dateStr}T${timeStr.length === 5 ? timeStr : timeStr.slice(0, 5)}:00Z`)
  const first = new Date(naive.getTime() - tzOffsetMinutes(naive) * 60000)
  return new Date(naive.getTime() - tzOffsetMinutes(first) * 60000)
}

/** Dzień tygodnia w konwencji aplikacji dla daty „YYYY-MM-DD". */
export function dayOfWeek(dateStr: string): number {
  const js = new Date(`${dateStr}T12:00:00Z`).getUTCDay() // 0 = niedziela
  return (js + 6) % 7
}

/** Dzień tygodnia (konwencja aplikacji) dla momentu ISO, liczony w czasie polskim. */
export function warsawDayOfWeek(iso: string): number {
  const short = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: TZ }).format(new Date(iso))
  return DAYS_EN_SHORT.indexOf(short)
}

/** Godzina „HH:MM" czasu polskiego dla momentu ISO. */
export function warsawTimeOfDay(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
}

const DAYS_EN_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Rozwija zakresy przerw (tabela holidays) na pojedyncze dni. */
export function expandBreaks(breaks: { start_date: string; end_date: string }[]): string[] {
  const out: string[] = []
  for (const b of breaks) {
    if (!b.start_date || !b.end_date) continue
    let cur = b.start_date.slice(0, 10)
    const last = b.end_date.slice(0, 10)
    // Bezpiecznik na wypadek odwróconego zakresu w danych.
    for (let i = 0; cur <= last && i < 400; i++) {
      out.push(cur)
      cur = addDays(cur, 1)
    }
  }
  return out
}

/**
 * Wszystkie terminy kursu. Zwraca lekcje w kolejności chronologicznej —
 * przy kilku terminach w tygodniu przeplatają się w naturalnej kolejności.
 */
export function generateLessons(config: CourseConfig, maxLessons = 500): GeneratedLesson[] {
  const { slots, startDate } = config
  // Bez daty końca (ongoing) generujemy do końca bieżącego roku szkolnego —
  // wiersze w bazie potrzebują konkretnej daty, więc „bezterminowo" to
  // w praktyce „na razie tyle, dogenerujemy później".
  const endDate = config.endDate || defaultCourseEndDate(startDate || '')
  if (!slots.length || !startDate || !endDate || endDate < startDate) return []

  const excluded = new Set((config.excludedDates ?? []).map((d) => d.slice(0, 10)))
  const byDay = new Map<number, Slot[]>()
  for (const s of slots) {
    if (s.day < 0 || s.day > 6 || !s.time) continue
    const list = byDay.get(s.day) ?? []
    list.push(s)
    byDay.set(s.day, list)
  }

  const out: GeneratedLesson[] = []
  let cur = startDate
  for (let guard = 0; cur <= endDate && guard < 2000; guard++) {
    if (!excluded.has(cur)) {
      for (const slot of byDay.get(dayOfWeek(cur)) ?? []) {
        const starts = warsawToUtc(cur, slot.time)
        const ends = new Date(starts.getTime() + Math.max(1, slot.durationMin) * 60000)
        out.push({ startsAt: starts.toISOString(), endsAt: ends.toISOString(), day: slot.day, time: slot.time })
        if (out.length >= maxLessons) return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      }
    }
    cur = addDays(cur, 1)
  }

  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

/** Ile lekcji wypada w danym miesiącu — do rozbicia wartości kursu na raty. */
export function lessonsPerMonth(lessons: GeneratedLesson[]): Record<string, number> {
  const acc: Record<string, number> = {}
  for (const l of lessons) {
    // Miesiąc liczony wg czasu polskiego — lekcja o 23:30 nie może wpaść
    // do kolejnego miesiąca tylko dlatego, że w UTC jest już po północy.
    const key = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit' })
      .format(new Date(l.startsAt))
    acc[key] = (acc[key] ?? 0) + 1
  }
  return acc
}

/** Domyślny koniec kursu: najbliższy 30 czerwca od podanej daty (rok szkolny). */
export function defaultCourseEndDate(fromDate: string): string {
  const year = Number(fromDate.slice(0, 4))
  const endThisYear = `${year}-06-30`
  return fromDate <= endThisYear ? endThisYear : `${year + 1}-06-30`
}

/** Krótki opis terminów, np. „wtorki 12:00 (30 min) · czwartki 12:15 (30 min)". */
export function describeSlots(slots: Slot[]): string {
  return slots
    .filter((s) => s.time)
    .map((s) => `${DAYS_PL[s.day] ?? '?'} ${s.time} (${s.durationMin} min)`)
    .join(' · ')
}
