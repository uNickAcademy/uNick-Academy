import type { SupabaseClient } from '@supabase/supabase-js'
import {
  computeMonthDue, chargeDescription, periodKey, periodLabel, periodFromDateString,
  lessonsInPeriod, pickLessonRate,
  type DueLine, type GroupInput, type LessonInput, type PlanInput, type Period,
} from './engine'

// Warstwa nad silnikiem: dociąga dane z bazy i dopisuje brakującą kwotę.
//
// Naliczamy zawsze RÓŻNICĘ między należnością za miesiąc a tym, co już
// obciążono za ten sam okres (transactions.billing_period). Dzięki temu zapis
// do grupy, cron pierwszego dnia miesiąca i doliczenie lekcji po pierwszych
// zajęciach mogą się na siebie nakładać, a uczeń i tak zapłaci dokładnie raz.

export type BillableStudent = {
  id: string
  name: string
  email: string | null
  customMonthlyPrice: number | null
}

export type ChargeOutcome = {
  student: BillableStudent
  period: Period
  periodLabel: string
  due: number
  alreadyCharged: number
  charged: number      // 0 = nic do naliczenia
  lines: DueLine[]
  description: string
}

export async function loadPricingPlans(supabase: SupabaseClient): Promise<PlanInput[]> {
  const { data } = await supabase
    .from('pricing_plans')
    .select('lessons_per_week, price_per_lesson')
    .eq('is_active', true)
  return (data ?? []).map((p) => ({
    lessonsPerWeek: Number(p.lessons_per_week),
    pricePerLesson: Number(p.price_per_lesson),
  }))
}

type Context = {
  groupsByStudent: Record<string, GroupInput[]>
  lessonsByStudent: Record<string, LessonInput[]>
  chargedByStudent: Record<string, number>
  plans: PlanInput[]
}

/**
 * Jedno zapytanie na tabelę dla całej paczki uczniów — cron potrafi przejść
 * przez całą szkołę, więc nie chcemy N+1.
 */
async function loadContext(supabase: SupabaseClient, studentIds: string[], period: Period): Promise<Context> {
  const key = periodKey(period)

  const [plans, memberships, lessons, charges] = await Promise.all([
    loadPricingPlans(supabase),
    supabase
      .from('group_members')
      .select('student_id, group:groups(name, price_per_month, start_date, end_date)')
      .in('student_id', studentIds),
    supabase
      .from('lessons')
      .select('student_id, starts_at, group_id')
      .in('student_id', studentIds)
      .is('cancelled_at', null),
    supabase
      .from('transactions')
      .select('student_id, amount, type')
      .in('student_id', studentIds)
      .eq('billing_period', key),
  ])

  const groupsByStudent: Record<string, GroupInput[]> = {}
  for (const m of memberships.data ?? []) {
    const g = (Array.isArray(m.group) ? m.group[0] : m.group) as
      { name?: string; price_per_month?: number | string | null; start_date?: string | null; end_date?: string | null } | undefined
    if (!g) continue
    ;(groupsByStudent[m.student_id] ??= []).push({
      name: g.name ?? 'Grupa',
      pricePerMonth: g.price_per_month != null ? Number(g.price_per_month) : null,
      startDate: g.start_date ?? null,
      endDate: g.end_date ?? null,
    })
  }

  const lessonsByStudent: Record<string, LessonInput[]> = {}
  for (const l of lessons.data ?? []) {
    ;(lessonsByStudent[l.student_id] ??= []).push({ startsAt: l.starts_at, groupId: l.group_id })
  }

  // Korekty (credit/payment przypisane do okresu) pomniejszają to, co już naliczono.
  const chargedByStudent: Record<string, number> = {}
  for (const t of charges.data ?? []) {
    const signed = t.type === 'charge' ? Number(t.amount) : -Number(t.amount)
    chargedByStudent[t.student_id] = (chargedByStudent[t.student_id] ?? 0) + signed
  }

  return { groupsByStudent, lessonsByStudent, chargedByStudent, plans }
}

/**
 * Nalicza uczniom brakującą kwotę za wskazany miesiąc.
 * `dryRun` liczy to samo, ale niczego nie zapisuje — pod podgląd w panelu.
 */
export async function chargeStudentsForPeriod(
  supabase: SupabaseClient,
  students: BillableStudent[],
  period: Period,
  opts: { dryRun?: boolean } = {},
): Promise<ChargeOutcome[]> {
  if (students.length === 0) return []

  const ctx = await loadContext(supabase, students.map((s) => s.id), period)
  const label = periodLabel(period)
  const outcomes: ChargeOutcome[] = []
  const toInsert: { student_id: string; type: 'charge'; amount: number; description: string; billing_period: string }[] = []

  for (const student of students) {
    const due = computeMonthDue({
      period,
      groups: ctx.groupsByStudent[student.id] ?? [],
      lessons: ctx.lessonsByStudent[student.id] ?? [],
      plans: ctx.plans,
      customMonthlyPrice: student.customMonthlyPrice,
    })

    const already = ctx.chargedByStudent[student.id] ?? 0
    const delta = Math.round(due.total - already)
    const description = chargeDescription(period, due.lines)

    outcomes.push({
      student, period, periodLabel: label,
      due: due.total, alreadyCharged: already,
      charged: delta > 0 ? delta : 0,
      lines: due.lines, description,
    })

    if (delta > 0 && !opts.dryRun) {
      toInsert.push({
        student_id: student.id, type: 'charge', amount: delta,
        description, billing_period: periodKey(period),
      })
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('transactions').insert(toInsert)
    if (error) throw new Error(`Nie udało się zapisać naliczeń: ${error.message}`)
  }

  return outcomes
}

/** Wygodny wariant dla pojedynczego ucznia (zapis do grupy, pierwsza lekcja). */
export async function chargeStudentForPeriod(
  supabase: SupabaseClient,
  student: BillableStudent,
  period: Period,
  opts: { dryRun?: boolean } = {},
): Promise<ChargeOutcome> {
  const [outcome] = await chargeStudentsForPeriod(supabase, [student], period, opts)
  return outcome
}

/**
 * Zapis na zajęcia indywidualne: przy rejestracji płatna jest sama pierwsza
 * lekcja. Resztę miesiąca dolicza `chargeStudentsForPeriod` po jej odbyciu —
 * naliczenie ląduje w tym samym okresie, więc różnica wyjdzie poprawna.
 */
export async function chargeFirstLesson(
  supabase: SupabaseClient,
  student: BillableStudent,
  firstLessonAt: string,
): Promise<{ charged: number; description: string } | null> {
  const period = periodFromDateString(firstLessonAt)
  const key = periodKey(period)

  const [plans, lessons, existing] = await Promise.all([
    loadPricingPlans(supabase),
    supabase.from('lessons').select('starts_at, group_id').eq('student_id', student.id).is('cancelled_at', null),
    supabase.from('transactions').select('id').eq('student_id', student.id).eq('billing_period', key).limit(1),
  ])

  if (existing.data && existing.data.length > 0) return null // miesiąc już ruszony

  const inMonth = lessonsInPeriod(
    (lessons.data ?? []).filter((l) => !l.group_id).map((l) => ({ startsAt: l.starts_at })),
    period,
  )
  const rate = Math.round(pickLessonRate(plans, Math.max(1, inMonth.length)))
  if (rate <= 0) return null

  const description = `Pierwsza lekcja — ${periodLabel(period)}`
  const { error } = await supabase.from('transactions').insert({
    student_id: student.id, type: 'charge', amount: rate, description, billing_period: key,
  })
  if (error) throw new Error(`Nie udało się naliczyć pierwszej lekcji: ${error.message}`)

  return { charged: rate, description }
}

/** Uczniowie objęci cyklem: bez kartotek przeniesionych i bez B2B (ich rozlicza faktura firmy). */
export async function loadBillableStudents(
  supabase: SupabaseClient,
  statuses: string[] = ['active', 'trial', 'overdue'],
): Promise<BillableStudent[]> {
  const { data } = await supabase
    .from('students')
    .select('id, full_name, custom_monthly_price, profile:profiles(full_name, email)')
    .in('status', statuses)
    .is('deleted_at', null)
    .neq('billing_type', 'b2b')

  return (data ?? []).map((s) => {
    const p = (Array.isArray(s.profile) ? s.profile[0] : s.profile) as { full_name?: string; email?: string } | undefined
    return {
      id: s.id,
      name: (s.full_name as string) || p?.full_name || 'Uczeń',
      email: p?.email ?? null,
      customMonthlyPrice: s.custom_monthly_price != null ? Number(s.custom_monthly_price) : null,
    }
  })
}
