// Silnik naliczeń — czyste funkcje, bez dostępu do bazy.
//
// Zasady rozliczeń uNick Academy:
//
// GRUPY — cena z karty grupy (np. 250 zł), płatna za każdy miesiąc trwania
// kursu, bez proporcji. Pierwszy miesiąc naliczamy przy zapisie (kurs
// startujący we wrześniu → przy zapisie płatność za wrzesień), kolejne
// pierwszego dnia każdego następnego miesiąca. Poza zakresem start–koniec
// kursu nie naliczamy nic.
//
// LEKCJE INDYWIDUALNE — stawka za lekcję razy liczba lekcji przypadających
// w danym miesiącu. Przy zapisie naliczamy pierwszą lekcję, po jej odbyciu
// resztę lekcji z tego miesiąca, a od kolejnego miesiąca cały miesiąc z góry.
//
// Wszystkie ścieżki liczą to samo: „ile uczeń jest winien za dany miesiąc".
// Naliczenie to zawsze różnica między tą kwotą a tym, co już obciążono za ten
// okres — dzięki temu żadna ze ścieżek nie policzy niczego dwa razy.

export const MONTHS_PL = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień',
]

const WEEKS_PER_MONTH = 4.33

export type Period = { year: number; month: number } // month: 0–11, jak w Date

export function periodOf(date: Date): Period {
  return { year: date.getFullYear(), month: date.getMonth() }
}

/** Klucz okresu = pierwszy dzień miesiąca, format YYYY-MM-DD (kolumna billing_period). */
export function periodKey(p: Period): string {
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-01`
}

export function periodLabel(p: Period): string {
  return `${MONTHS_PL[p.month]} ${p.year}`
}

export function addMonths(p: Period, n: number): Period {
  const total = p.year * 12 + p.month + n
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 }
}

/** Ujemne = a wcześniej niż b. */
export function comparePeriods(a: Period, b: Period): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month)
}

export function periodFromDateString(iso: string): Period {
  const [y, m] = iso.slice(0, 10).split('-').map(Number)
  return { year: y, month: m - 1 }
}

export type GroupInput = {
  name: string
  pricePerMonth: number | null
  startDate: string | null
  endDate: string | null
}

export type LessonInput = { startsAt: string; groupId?: string | null }

export type PlanInput = { lessonsPerWeek: number; pricePerLesson: number }

/** Czy kurs trwa w danym miesiącu (miesiąc mieści się w zakresie start–koniec). */
export function groupRunsIn(group: GroupInput, p: Period): boolean {
  if (group.startDate && comparePeriods(periodFromDateString(group.startDate), p) > 0) return false
  if (group.endDate && comparePeriods(periodFromDateString(group.endDate), p) < 0) return false
  return true
}

/** Miesiąc pierwszego naliczenia dla kursu: start kursu albo bieżący miesiąc, jeśli kurs już trwa. */
export function firstBillablePeriod(group: GroupInput, today: Date): Period {
  const now = periodOf(today)
  if (!group.startDate) return now
  const start = periodFromDateString(group.startDate)
  return comparePeriods(start, now) > 0 ? start : now
}

export function lessonsInPeriod(lessons: LessonInput[], p: Period): LessonInput[] {
  return lessons.filter((l) => comparePeriods(periodFromDateString(l.startsAt), p) === 0)
}

/**
 * Stawka za lekcję z cennika — plan dobieramy do faktycznego tempa zajęć
 * (im więcej lekcji w tygodniu, tym niższa stawka jednostkowa).
 */
export function pickLessonRate(plans: PlanInput[], lessonsInMonth: number): number {
  const sorted = [...plans].sort((a, b) => a.lessonsPerWeek - b.lessonsPerWeek)
  if (sorted.length === 0) return 0
  const perWeek = Math.max(1, Math.round(lessonsInMonth / WEEKS_PER_MONTH))
  const match = [...sorted].reverse().find((p) => p.lessonsPerWeek <= perWeek)
  return Number((match ?? sorted[0]).pricePerLesson)
}

export type DueLine = { label: string; amount: number }
export type MonthDue = { total: number; lines: DueLine[]; lessonsCount: number; lessonRate: number }

export type DueInput = {
  period: Period
  groups: GroupInput[]
  /** Lekcje ucznia (nieodwołane). Lekcje grupowe są pomijane — pokrywa je abonament grupy. */
  lessons: LessonInput[]
  plans: PlanInput[]
  /** Wynegocjowana cena miesięczna — jeśli ustawiona, zastępuje całą kalkulację. */
  customMonthlyPrice?: number | null
  /** Ustalona cena za pojedyncze zajęcia — ma pierwszeństwo przed cennikiem. */
  customLessonPrice?: number | null
}

export function computeMonthDue(input: DueInput): MonthDue {
  const { period, groups, lessons, plans, customMonthlyPrice, customLessonPrice } = input

  const runningGroups = groups.filter((g) => groupRunsIn(g, period))
  const individual = lessonsInPeriod(lessons.filter((l) => !l.groupId), period)

  // Twarda zasada: bez zajęć nie ma opłaty. Uczeń, który w danym miesiącu nie
  // ma ani kursu w toku, ani żadnej lekcji, nie może dostać obciążenia —
  // dotyczy to również cen wynegocjowanych indywidualnie.
  if (runningGroups.length === 0 && individual.length === 0) {
    return { total: 0, lines: [], lessonsCount: 0, lessonRate: 0 }
  }

  if (customMonthlyPrice != null && Number(customMonthlyPrice) > 0) {
    const amount = Math.round(Number(customMonthlyPrice))
    return { total: amount, lines: [{ label: 'Cena indywidualna', amount }], lessonsCount: individual.length, lessonRate: 0 }
  }

  const lines: DueLine[] = []

  for (const g of runningGroups) {
    const price = g.pricePerMonth != null ? Number(g.pricePerMonth) : 0
    if (price <= 0) continue
    lines.push({ label: g.name, amount: Math.round(price) })
  }

  // Cena ustalona przy zatwierdzaniu kursu bije cennik ogólny.
  const rate = individual.length === 0
    ? 0
    : customLessonPrice != null && Number(customLessonPrice) > 0
      ? Math.round(Number(customLessonPrice))
      : pickLessonRate(plans, individual.length)
  if (individual.length > 0 && rate > 0) {
    lines.push({
      label: `Lekcje indywidualne (${individual.length} × ${rate} zł)`,
      amount: Math.round(individual.length * rate),
    })
  }

  return {
    total: lines.reduce((a, l) => a + l.amount, 0),
    lines,
    lessonsCount: individual.length,
    lessonRate: rate,
  }
}

/** Opis transakcji — czytelny w historii płatności ucznia. */
export function chargeDescription(p: Period, lines: DueLine[]): string {
  const base = `Abonament ${periodLabel(p)}`
  return lines.length === 1 ? `${base} — ${lines[0].label}` : base
}
