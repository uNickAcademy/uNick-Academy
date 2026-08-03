import { cookies } from 'next/headers'
import { createClient } from './server'
import { REFERRAL_BONUS_PLN } from '@/lib/referral'
import type { Student, Teacher, Lesson, Transaction, Referral, Availability, Holiday, Group, PricingPlan, DiscountCode, Company, Invoice, B2bLead } from '@/types'

// ──────────────────────────────────────────
// STUDENT
// ──────────────────────────────────────────

// Wszystkie dzieci/podkonta wiszące pod jednym kontem rodzica (profilem).
export async function getStudentsByProfileId(profileId: string): Promise<Student[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('students')
    .select(`
      *,
      profile:profiles(*),
      teacher:teachers(*, profile:profiles(*))
    `)
    .eq('profile_id', profileId)
    .is('deleted_at', null)
    .order('joined_at', { ascending: true })
  return (data as Student[]) ?? []
}

// Aktywne podkonto: rodzic z kilkorgiem dzieci wybiera dziecko przełącznikiem
// w panelu (cookie active_student); pojedynczy uczeń dostaje swoje jedyne konto.
// Cookie spoza listy dzieci danego profilu jest ignorowane.
export async function getStudentByProfileId(profileId: string): Promise<Student | null> {
  const students = await getStudentsByProfileId(profileId)
  if (students.length === 0) return null
  const activeId = (await cookies()).get('active_student')?.value
  return students.find((s) => s.id === activeId) ?? students[0]
}

// Łączne saldo rodziny = suma sald wszystkich podkont danego rodzica.
export async function getFamilyBalance(profileId: string): Promise<number> {
  const students = await getStudentsByProfileId(profileId)
  return students.reduce((sum, s) => sum + (s.credit_balance ?? 0), 0)
}

export async function getStudentLessons(studentId: string): Promise<Lesson[]> {
  const supabase = await createClient()

  // Grupy, do których należy uczeń – żeby pokazać też lekcje grupowe
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('student_id', studentId)
  const groupIds = (memberships ?? []).map((m) => m.group_id)

  let query = supabase
    .from('lessons')
    .select(`*, teacher:teachers(*, profile:profiles(*)), materials:lesson_materials(*), group:groups(*)`)
    .is('cancelled_at', null)
    .order('starts_at', { ascending: true })

  query = groupIds.length > 0
    ? query.or(`student_id.eq.${studentId},group_id.in.(${groupIds.join(',')})`)
    : query.eq('student_id', studentId)

  const { data } = await query
  return (data as Lesson[]) ?? []
}

export async function getStudentTransactions(studentId: string): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  return (data as Transaction[]) ?? []
}

export async function getStudentReferrals(studentId: string): Promise<Referral[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('referrals')
    .select(`*, referred:students!referred_id(id, full_name, profile:profiles(*))`)
    .eq('referrer_id', studentId)
    .order('created_at', { ascending: false })
  return (data as Referral[]) ?? []
}

export async function getStudentBalance(studentId: string): Promise<number> {
  const transactions = await getStudentTransactions(studentId)
  return transactions.reduce((acc, tx) => {
    if (tx.type === 'charge') return acc - tx.amount
    return acc + tx.amount
  }, 0)
}

// ──────────────────────────────────────────
// ADMIN – STUDENCI
// ──────────────────────────────────────────

export async function getAllStudents(): Promise<Student[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('students')
    .select(`
      *,
      profile:profiles(*),
      teacher:teachers(*, profile:profiles(*))
    `)
    .is('deleted_at', null)
    .order('joined_at', { ascending: false })
  return (data as Student[]) ?? []
}

// Poczekalnia – uczniowie przeniesieni (do przywrócenia)
export async function getDeletedStudents(): Promise<Student[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('students')
    .select(`*, profile:profiles(*)`)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  return (data as Student[]) ?? []
}

export async function getStudentById(id: string): Promise<Student | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('students')
    .select(`*, profile:profiles(*), teacher:teachers(*, profile:profiles(*))`)
    .eq('id', id)
    .single()
  return data as Student | null
}

// Sumaryczna liczba zrealizowanych godzin lekcji per uczeń (lekcje w przeszłości)
export async function getStudentHoursMap(): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lessons')
    .select('student_id, starts_at, ends_at')
    .lte('starts_at', new Date().toISOString())

  const map: Record<string, number> = {}
  for (const l of data ?? []) {
    const hours = (new Date(l.ends_at).getTime() - new Date(l.starts_at).getTime()) / 3_600_000
    map[l.student_id] = (map[l.student_id] ?? 0) + hours
  }
  return map
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('students').update(updates).eq('id', id)
  return { error: error?.message ?? null }
}

// ──────────────────────────────────────────
// ADMIN – NAUCZYCIELE
// ──────────────────────────────────────────

// Kolumny bezpieczne do publicznego odczytu (strony /nauczyciele i /zapisy,
// dostępne bez logowania). Nie dołączaj tu hourly_rate/rate_group/
// whatsapp_phone/location/contract_type — rola `anon` nie ma do nich GRANT-u
// (migracja 104), więc select('*') zwróciłby błąd uprawnień dla gościa.
export async function getAllTeachers(): Promise<Teacher[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('teachers')
    .select(`id, profile_id, bio, levels, rating, review_count, video_url, color, is_active, created_at, contact_email, sort_order, photo_url, profile:profiles(id, full_name)`)
    .eq('is_active', true)
    .order('sort_order')
    .order('created_at')
  return (data as unknown as Teacher[]) ?? []
}

// Admin: wszyscy nauczyciele (również nieaktywni)
export async function getAllTeachersAdmin(): Promise<Teacher[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('teachers')
    .select(`*, profile:profiles(*)`)
    .order('sort_order')
    .order('created_at')
  return (data as Teacher[]) ?? []
}

// Admin: statystyki per nauczyciel (liczba uczniów, lekcje w tym tygodniu, łącznie)
export async function getTeacherStatsMap(): Promise<Record<string, { students: number; lessonsWeek: number; lessonsTotal: number }>> {
  const supabase = await createClient()
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [studentsRes, lessonsRes] = await Promise.all([
    supabase.from('students').select('teacher_id'),
    supabase.from('lessons').select('teacher_id, starts_at'),
  ])

  const map: Record<string, { students: number; lessonsWeek: number; lessonsTotal: number }> = {}
  const ensure = (id: string) => (map[id] ??= { students: 0, lessonsWeek: 0, lessonsTotal: 0 })

  for (const s of studentsRes.data ?? []) {
    if (s.teacher_id) ensure(s.teacher_id).students++
  }
  for (const l of lessonsRes.data ?? []) {
    const m = ensure(l.teacher_id)
    m.lessonsTotal++
    if (l.starts_at >= weekAgo) m.lessonsWeek++
  }
  return map
}

export async function updateTeacher(id: string, updates: Partial<Teacher>): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('teachers').update(updates).eq('id', id)
  return { error: error?.message ?? null }
}

// ──────────────────────────────────────────
// ADMIN – LEKCJE
// ──────────────────────────────────────────

export async function getAllLessons(from?: string, to?: string): Promise<Lesson[]> {
  const supabase = await createClient()
  let query = supabase
    .from('lessons')
    .select(`
      *,
      student:students(*, profile:profiles(*)),
      teacher:teachers(*, profile:profiles(*)),
      group:groups(*)
    `)
    .is('cancelled_at', null)
    .order('starts_at', { ascending: true })

  if (from) query = query.gte('starts_at', from)
  if (to) query = query.lte('starts_at', to)

  const { data } = await query
  return (data as Lesson[]) ?? []
}

export async function createLesson(lesson: Omit<Lesson, 'id'>): Promise<Lesson | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lessons')
    .insert(lesson)
    .select()
    .single()
  return data as Lesson | null
}

export async function updateLesson(id: string, updates: Partial<Lesson>): Promise<void> {
  const supabase = await createClient()
  await supabase.from('lessons').update(updates).eq('id', id)
}

export async function deleteLesson(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('lessons').delete().eq('id', id)
}

// ──────────────────────────────────────────
// ADMIN – TRANSAKCJE
// ──────────────────────────────────────────

export async function addTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): Promise<void> {
  const supabase = await createClient()
  await supabase.from('transactions').insert(tx)
}

export async function addCreditToStudent(studentId: string, amount: number, description: string): Promise<void> {
  const supabase = await createClient()
  // Saldo (credit_balance) przelicza trigger trg_recalc_balance na podstawie transakcji
  await supabase.from('transactions').insert({
    student_id: studentId,
    type: 'credit',
    amount,
    description,
  })
}

// ──────────────────────────────────────────
// POLECENIA
// ──────────────────────────────────────────

export async function getAllReferrals(): Promise<Referral[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('referrals')
    .select(`*,
      referrer:students!referrer_id(id, full_name, referral_code, profile:profiles(full_name)),
      referred:students!referred_id(id, full_name, profile:profiles(full_name))`)
    .order('created_at', { ascending: false })
  return (data as Referral[]) ?? []
}

export async function getStudentByReferralCode(code: string): Promise<Student | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('students')
    .select(`*, profile:profiles(*)`)
    .eq('referral_code', code.toUpperCase())
    .single()
  return data as Student | null
}

export async function applyReferral(referrerId: string, referredId: string, code: string): Promise<void> {
  const supabase = await createClient()

  // Zapisz polecenie
  await supabase.from('referrals').insert({
    referrer_id: referrerId,
    referred_id: referredId,
    code,
    referrer_credit: REFERRAL_BONUS_PLN,
    referred_discount: REFERRAL_BONUS_PLN,
  })

  // Dodaj kredyt polecającemu
  await addCreditToStudent(referrerId, REFERRAL_BONUS_PLN, `Kredyt z polecenia`)

  // Obniż pierwszą płatność poleconego (zapisz jako kredyt)
  await addCreditToStudent(referredId, REFERRAL_BONUS_PLN, `Zniżka z kodu polecenia ${code}`)
}

// ──────────────────────────────────────────
// NAUCZYCIEL
// ──────────────────────────────────────────

export async function getTeacherByProfileId(profileId: string): Promise<Teacher | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('teachers')
    .select(`*, profile:profiles(*)`)
    .eq('profile_id', profileId)
    .single()
  return data as Teacher | null
}

export type TeacherPublicProfile = { photo: string | null; bio: string; video: string | null; availability: Availability[] }

// Mapuje aktywnych nauczycieli na dane potrzebne na stronie /meet-us (zdjęcie, bio,
// dostępność, filmik), kluczowane prefiksem e-maila (np. "nick@unick-academy.pl" → "nick"),
// żeby strona marketingowa mogła nadpisać statyczny opis tymi danymi z panelu nauczyciela.
export async function getTeacherPublicProfiles(): Promise<Record<string, TeacherPublicProfile>> {
  const supabase = await createClient()
  const [teachersRes, availRes] = await Promise.all([
    supabase.from('teachers').select('id, bio, photo_url, video_url, profile:profiles(email)').eq('is_active', true),
    supabase.from('availability').select('*').eq('is_active', true),
  ])

  const availByTeacher: Record<string, Availability[]> = {}
  for (const a of (availRes.data as Availability[]) ?? []) {
    (availByTeacher[a.teacher_id] ??= []).push(a)
  }

  const map: Record<string, TeacherPublicProfile> = {}
  for (const t of teachersRes.data ?? []) {
    const rec = t as Record<string, unknown>
    const profile = rec.profile as { email?: string } | null
    const email = profile?.email
    if (!email) continue
    map[email.split('@')[0].toLowerCase()] = {
      photo: (rec.photo_url as string) ?? null,
      bio: (rec.bio as string) ?? '',
      video: (rec.video_url as string) ?? null,
      availability: availByTeacher[rec.id as string] ?? [],
    }
  }
  return map
}

export async function updateTeacherProfile(
  teacherId: string,
  updates: { bio?: string; contact_email?: string }
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('teachers').update(updates).eq('id', teacherId)
}

export async function getTeacherAvailability(teacherId: string): Promise<Availability[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('availability')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })
  return (data as Availability[]) ?? []
}

export async function setTeacherAvailability(
  teacherId: string,
  slots: Omit<Availability, 'id' | 'teacher_id'>[]
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('availability').delete().eq('teacher_id', teacherId)
  if (slots.length > 0) {
    await supabase.from('availability').insert(
      slots.map((s) => ({ ...s, teacher_id: teacherId }))
    )
  }
}

export async function getTeacherStudents(teacherId: string): Promise<Student[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('students')
    .select(`*, profile:profiles(*)`)
    .eq('teacher_id', teacherId)
    .order('joined_at', { ascending: false })
  return (data as Student[]) ?? []
}

export async function getTeacherLessons(teacherId: string, from?: string, to?: string): Promise<Lesson[]> {
  const supabase = await createClient()
  let query = supabase
    .from('lessons')
    .select(`*, student:students(*, profile:profiles(*)), materials:lesson_materials(*), group:groups(*)`)
    .eq('teacher_id', teacherId)
    .is('cancelled_at', null)
    .order('starts_at', { ascending: true })

  if (from) query = query.gte('starts_at', from)
  if (to) query = query.lte('starts_at', to)

  const { data } = await query
  return (data as Lesson[]) ?? []
}

// ──────────────────────────────────────────
// DASHBOARD ADMIN – statystyki
// ──────────────────────────────────────────

export async function getAdminStats() {
  const supabase = await createClient()

  const [studentsRes, lessonsRes, transactionsRes] = await Promise.all([
    supabase.from('students').select('id, status').eq('status', 'active'),
    supabase.from('lessons').select('id')
      .is('cancelled_at', null)
      .gte('starts_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .lte('starts_at', new Date().toISOString()),
    supabase.from('transactions')
      .select('amount, type')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

  const revenue = (transactionsRes.data ?? [])
    .filter((t) => t.type === 'payment')
    .reduce((acc, t) => acc + t.amount, 0)

  return {
    activeStudents: studentsRes.data?.length ?? 0,
    lessonsThisWeek: lessonsRes.data?.length ?? 0,
    monthlyRevenue: revenue,
  }
}

// Raport zagrożonych rezygnacją: uczniowie z 3+ nieodbytymi lekcjami z rzędu
// (nieobecność, no-show lub późne odwołanie). Odwołanie w terminie (excused)
// to legalne przełożenie z odrabianiem — nie sygnalizuje rezygnacji.
const MISSED: string[] = ['absent', 'no_show', 'late_cancellation']
export async function getChurnRisk(): Promise<{ id: string; name: string; consecutiveAbsences: number }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lessons')
    .select('student_id, starts_at, attendance, student:students(profile:profiles(full_name))')
    .is('cancelled_at', null)
    .lte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: false })

  // grupuj po uczniu zachowując kolejność malejącą po dacie
  const byStudent: Record<string, { name: string; atts: string[] }> = {}
  for (const l of data ?? []) {
    if (!l.student_id) continue
    // @ts-expect-error zagnieżdżenie
    const name = l.student?.profile?.full_name ?? '—'
    byStudent[l.student_id] ??= { name, atts: [] }
    byStudent[l.student_id].atts.push(l.attendance)
  }

  const risk: { id: string; name: string; consecutiveAbsences: number }[] = []
  for (const [id, s] of Object.entries(byStudent)) {
    let streak = 0
    for (const a of s.atts) {
      if (MISSED.includes(a)) streak++
      else break
    }
    if (streak >= 3) risk.push({ id, name: s.name, consecutiveAbsences: streak })
  }
  return risk.sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences)
}

// Przychód w bieżącym miesiącu w rozbiciu na typ rozliczenia (B2B vs indywidualni)
export async function getBillingSummary(): Promise<{ individual: number; b2b: number; vatCollected: number }> {
  const supabase = await createClient()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const { data } = await supabase
    .from('transactions')
    .select('amount, type, student:students(billing_type, vat_rate)')
    .eq('type', 'payment')
    .gte('created_at', monthStart)

  let individual = 0, b2b = 0, vatCollected = 0
  for (const t of data ?? []) {
    const amount = Number(t.amount)
    // @ts-expect-error zagnieżdżony student z joinu
    const bt = t.student?.billing_type ?? 'individual'
    // @ts-expect-error zagnieżdżony student z joinu
    const vat = t.student?.vat_rate ? Number(t.student.vat_rate) : 0
    if (bt === 'b2b') {
      b2b += amount
      if (vat > 0) vatCollected += amount - amount / (1 + vat / 100) // VAT zawarty w kwocie brutto
    } else {
      individual += amount
    }
  }
  return { individual: Math.round(individual), b2b: Math.round(b2b), vatCollected: Math.round(vatCollected) }
}

// Raport zaległości: uczniowie z ujemnym saldem lub statusem 'overdue'
export async function getOverdueReport(): Promise<{ students: { id: string; name: string; balance: number }[]; total: number }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('students')
    .select('id, credit_balance, status, profile:profiles(full_name)')
    .or('credit_balance.lt.0,status.eq.overdue')

  const students = (data ?? []).map((s) => ({
    id: s.id,
    // @ts-expect-error – zagnieżdżony profil z joinu
    name: s.profile?.full_name ?? '—',
    balance: Number(s.credit_balance),
  }))
  const total = students.reduce((acc, s) => acc + (s.balance < 0 ? -s.balance : 0), 0)
  return { students, total }
}

// Ostatnie transakcje z nazwą ucznia
export async function getRecentTransactions(limit = 50): Promise<
  { id: string; student: string; type: string; amount: number; description: string; created_at: string }[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('id, type, amount, description, created_at, student:students(profile:profiles(full_name))')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((t) => ({
    id: t.id,
    // @ts-expect-error – zagnieżdżony profil z joinu
    student: t.student?.profile?.full_name ?? '—',
    type: t.type,
    amount: Number(t.amount),
    description: t.description,
    created_at: t.created_at,
  }))
}

// ──────────────────────────────────────────
// PRZERWY ŚWIĄTECZNE / WAKACYJNE
// ──────────────────────────────────────────

export async function getHolidays(): Promise<Holiday[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('holidays').select('*').order('start_date')
  return (data as Holiday[]) ?? []
}

// ──────────────────────────────────────────
// GRUPY
// ──────────────────────────────────────────

// ──────────────────────────────────────────
// FIRMY / B2B / FAKTURY
// ──────────────────────────────────────────

export async function getAllCompanies(): Promise<(Company & { employeeCount: number; hrName: string | null })[]> {
  const supabase = await createClient()
  const [companiesRes, studentsRes, hrRes] = await Promise.all([
    supabase.from('companies').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('students').select('company_id'),
    supabase.from('profiles').select('full_name, company_id').eq('role', 'hr'),
  ])
  const counts: Record<string, number> = {}
  for (const s of studentsRes.data ?? []) { if (s.company_id) counts[s.company_id] = (counts[s.company_id] ?? 0) + 1 }
  const hrByCompany: Record<string, string> = {}
  for (const h of hrRes.data ?? []) { if (h.company_id) hrByCompany[h.company_id] = h.full_name }
  return (companiesRes.data ?? []).map((c) => ({
    ...c, employeeCount: counts[c.id] ?? 0, hrName: hrByCompany[c.id] ?? null,
  })) as (Company & { employeeCount: number; hrName: string | null })[]
}

export async function getDeletedCompanies(): Promise<Company[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('companies')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  return (data as Company[]) ?? []
}

export async function getInvoices(): Promise<(Invoice & { companyName: string | null; studentName: string | null })[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('*, company:companies(name), student:students(profile:profiles(full_name))')
    .order('issued_at', { ascending: false })
  return (data ?? []).map((i) => {
    const rec = i as Record<string, unknown>
    const company = rec.company as { name?: string } | null
    const student = rec.student as { profile?: { full_name?: string } | null } | null
    return {
      ...i,
      companyName: company?.name ?? null,
      studentName: student?.profile?.full_name ?? null,
    }
  }) as (Invoice & { companyName: string | null; studentName: string | null })[]
}

// Raport wypisanych z grup (dropout)
export async function getDropouts(): Promise<{ id: string; groupName: string; studentName: string; removedAt: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('group_removals').select('*').order('removed_at', { ascending: false }).limit(100)
  return (data ?? []).map((r) => ({ id: r.id, groupName: r.group_name ?? '—', studentName: r.student_name ?? '—', removedAt: r.removed_at }))
}

// ── Regulamin i zgody ──
export async function getCurrentTerms() {
  const supabase = await createClient()
  const { data } = await supabase.from('terms_documents').select('*').eq('is_current', true).order('version', { ascending: false }).limit(1).maybeSingle()
  return data as { id: string; version: number; title: string; content: string } | null
}

export async function getConsentTypes() {
  const supabase = await createClient()
  const { data } = await supabase.from('consent_types').select('*').eq('is_active', true).order('sort')
  return (data ?? []) as { id: string; label: string; description: string | null; required: boolean }[]
}

export async function getConsentAcceptances() {
  const supabase = await createClient()
  const { data } = await supabase.from('consent_acceptances').select('*').order('accepted_at', { ascending: false }).limit(100)
  return (data ?? []) as { id: string; full_name: string | null; email: string | null; terms_version: number | null; consents: Record<string, boolean>; accepted_at: string }[]
}

// ── Zastępstwa ──
export async function getSubstitutions(): Promise<{
  id: string; lessonId: string; reason: string; status: string; createdAt: string
  startsAt: string; student: string; topic: string; originalTeacherId: string; originalTeacher: string; substituteTeacher: string | null
}[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('substitutions')
    .select(`id, lesson_id, reason, status, created_at, original_teacher_id,
      lesson:lessons(starts_at, topic, student:students(profile:profiles(full_name)), group:groups(name)),
      original:teachers!substitutions_original_teacher_id_fkey(profile:profiles(full_name)),
      substitute:teachers!substitutions_substitute_teacher_id_fkey(profile:profiles(full_name))`)
    .order('created_at', { ascending: false })

  return (data ?? []).map((s) => {
    const rec = s as Record<string, unknown>
    const lesson = (Array.isArray(rec.lesson) ? rec.lesson[0] : rec.lesson) as Record<string, unknown> | null
    const ls = lesson?.student as { profile?: { full_name?: string } | null } | null
    const lg = lesson?.group as { name?: string } | null
    const orig = (Array.isArray(rec.original) ? rec.original[0] : rec.original) as { profile?: { full_name?: string } | null } | null
    const sub = (Array.isArray(rec.substitute) ? rec.substitute[0] : rec.substitute) as { profile?: { full_name?: string } | null } | null
    return {
      id: s.id, lessonId: s.lesson_id, reason: s.reason ?? '', status: s.status, createdAt: s.created_at,
      startsAt: (lesson?.starts_at as string) ?? '',
      student: lg?.name ? `${lg.name} (grupa)` : (ls?.profile?.full_name ?? '—'),
      topic: (lesson?.topic as string) ?? '',
      originalTeacherId: (rec.original_teacher_id as string) ?? '',
      originalTeacher: orig?.profile?.full_name ?? '—',
      substituteTeacher: sub?.profile?.full_name ?? null,
    }
  })
}

// ── Pipeline B2B (CRM) ──
export async function getB2bLeads(): Promise<B2bLead[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('b2b_leads').select('*').order('created_at', { ascending: false })
  return (data as B2bLead[]) ?? []
}

// ── HR (RLS ogranicza wyniki do firmy zalogowanego HR) ──
export async function getHrCompany(): Promise<Company | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('companies').select('*').limit(1).maybeSingle()
  return data as Company | null
}

export async function getHrEmployees(): Promise<Student[]> {
  const supabase = await createClient()
  // RLS zawęża do firmy HR (polityka "HR widzi pracowników firmy" na students);
  // dodatkowy filtr po company_id to obrona w głąb na wypadek zmiany polityk.
  const company = await getHrCompany()
  if (!company) return []
  const { data } = await supabase
    .from('students')
    .select('*, profile:profiles(*), teacher:teachers(*, profile:profiles(*))')
    .eq('company_id', company.id)
    .order('joined_at', { ascending: false })
  return (data as Student[]) ?? []
}

export async function getHrLessons(from?: string, to?: string): Promise<Lesson[]> {
  const supabase = await createClient()
  let query = supabase
    .from('lessons')
    .select('*, teacher:teachers(*, profile:profiles(*)), student:students(*, profile:profiles(*))')
    .order('starts_at', { ascending: true })
  if (from) query = query.gte('starts_at', from)
  if (to) query = query.lte('starts_at', to)
  const { data } = await query
  return (data as Lesson[]) ?? []
}

export async function getHrInvoices(): Promise<Invoice[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('invoices').select('*').order('issued_at', { ascending: false })
  return (data as Invoice[]) ?? []
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('pricing_plans').select('*').order('lessons_per_week')
  return (data as PricingPlan[]) ?? []
}

export async function getDiscountCodes(): Promise<DiscountCode[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false })
  return (data as DiscountCode[]) ?? []
}

// Klucz do sortowania grafiku: dzień tygodnia (0=pon), potem godzina z
// schedule_text (np. "16:30"). Brak dnia/godziny → na koniec.
function chronoKey(dayOfWeek: number | null | undefined, scheduleText: string | null | undefined): number {
  const day = dayOfWeek == null ? 9 : dayOfWeek
  const m = (scheduleText ?? '').match(/(\d{1,2}):(\d{2})/)
  const minutes = m ? Number(m[1]) * 60 + Number(m[2]) : 9999
  return day * 10000 + minutes
}

export async function getAllGroups(): Promise<Group[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('groups')
    .select(`*, teacher:teachers(*, profile:profiles(*)), members:group_members(student:students(*, profile:profiles(*)))`)
  return (data ?? []).map((g) => ({
    ...g,
    // spłaszcz members z zagnieżdżenia group_members → student
    members: (g.members ?? []).map((m: { student: Student }) => m.student),
  })).sort((a, b) => chronoKey(a.day_of_week, a.schedule_text) - chronoKey(b.day_of_week, b.schedule_text)) as Group[]
}

// ──────────────────────────────────────────
// PUBLICZNE – KREATOR ZAPISÓW
// ──────────────────────────────────────────

export type PublicGroup = {
  id: string; name: string; level: string; levels: string[]; schedule_text: string; description: string
  age_range: string; ageMin: number | null; ageMax: number | null
  color: string; capacity: number; taken: number; spots: number
  teacherName: string; teacherId: string; format: 'online' | 'offline' | null
  pricePerMonth: number | null; dayOfWeek: number | null
  startDate: string | null; endDate: string | null
}

// Aktywne grupy z liczbą wolnych miejsc (do publicznego zapisu).
//
// Liczba zajętych miejsc idzie przez RPC, nie przez zagnieżdżony odczyt
// `group_members`: polityka RLS udostępnia członkostwa wyłącznie zalogowanym,
// więc anonimowy gość dostawał pustą tablicę — bez błędu — i każda grupa
// pokazywała komplet wolnych miejsc. Funkcja z migracji 120 zwraca same liczby,
// bez danych osobowych.
export async function getPublicGroups(): Promise<PublicGroup[]> {
  const supabase = await createClient()
  const [{ data }, { data: seatCounts }] = await Promise.all([
    supabase
      .from('groups')
      .select(`id, name, level, levels, color, capacity, schedule_text, description, age_range, age_min, age_max, format, price_per_month, day_of_week, start_date, end_date,
               teacher:teachers(id, profile:profiles(full_name))`)
      .eq('is_active', true),
    supabase.rpc('public_group_seat_counts'),
  ])
  const takenByGroup = new Map<string, number>(
    ((seatCounts as { group_id: string; taken: number }[] | null) ?? []).map((c) => [c.group_id, Number(c.taken)])
  )
  return (data ?? []).map((g) => {
    const capacity = (g.capacity as number) ?? 0
    const taken = takenByGroup.get(g.id as string) ?? 0
    const teacher = g.teacher as { id?: string; profile?: { full_name?: string } } | null
    const levels = Array.isArray(g.levels) ? (g.levels as string[]) : []
    return {
      id: g.id as string, name: g.name as string, level: g.level as string,
      levels: levels.length > 0 ? levels : [g.level as string],
      schedule_text: (g.schedule_text as string) ?? '', description: (g.description as string) ?? '',
      age_range: (g.age_range as string) ?? '',
      ageMin: g.age_min != null ? Number(g.age_min) : null,
      ageMax: g.age_max != null ? Number(g.age_max) : null,
      color: (g.color as string) ?? '#23479E',
      capacity, taken, spots: Math.max(capacity - taken, 0),
      teacherName: teacher?.profile?.full_name ?? '—', teacherId: teacher?.id ?? '',
      format: (g.format as 'online' | 'offline' | null) ?? null,
      pricePerMonth: g.price_per_month != null ? Number(g.price_per_month) : null,
      dayOfWeek: g.day_of_week != null ? Number(g.day_of_week) : null,
      startDate: (g.start_date as string) ?? null,
      endDate: (g.end_date as string) ?? null,
    }
  }).sort((a, b) => chronoKey(a.dayOfWeek, a.schedule_text) - chronoKey(b.dayOfWeek, b.schedule_text))
}

// Tygodniowa dostępność wszystkich nauczycieli (mapowanie teacherId → sloty)
export async function getPublicAvailability(): Promise<Record<string, Availability[]>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('availability')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })
  const map: Record<string, Availability[]> = {}
  for (const a of (data as Availability[]) ?? []) {
    (map[a.teacher_id] ??= []).push(a)
  }
  return map
}

// Prośby o zapis stacjonarny (panel admina)
export async function getBookingRequests(): Promise<Record<string, unknown>[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('booking_requests')
    .select('*, student:students(id, full_name)')
    .order('created_at', { ascending: false })
  return (data as Record<string, unknown>[]) ?? []
}

// Liczba oczekujących próśb o zapis (do odznaki w panelu admina)
export async function getPendingBookingRequestsCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('booking_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  return count ?? 0
}

// Zapisy online czekające na akceptację admina. Lekcje z jednego zapisu tworzą
// serię (ten sam uczeń + nauczyciel + link), więc zwijamy je do jednej pozycji
// opisanej pierwszą lekcją i liczbą lekcji w serii.
export type PendingOnlineBooking = {
  studentId: string
  studentName: string
  email: string
  phone: string
  teacherId: string
  teacherName: string
  firstStartsAt: string
  durationMinutes: number
  lessonCount: number
  meetingUrl: string
  monthlyPrice: number | null
  createdAt: string
}
export async function getPendingOnlineBookings(): Promise<PendingOnlineBooking[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('lessons')
    .select(`id, student_id, teacher_id, starts_at, ends_at, meeting_url, created_at,
             student:students(id, full_name, phone, custom_monthly_price, profile:profiles(full_name, email, phone)),
             teacher:teachers(id, profile:profiles(full_name))`)
    .eq('is_confirmed', false)
    .eq('type', 'online')
    .order('starts_at', { ascending: true })

  const bySeries = new Map<string, PendingOnlineBooking>()
  for (const l of data ?? []) {
    const student = (Array.isArray(l.student) ? l.student[0] : l.student) as Record<string, unknown> | null
    const teacher = (Array.isArray(l.teacher) ? l.teacher[0] : l.teacher) as Record<string, unknown> | null
    if (!student) continue
    const sp = student.profile as { full_name?: string; email?: string; phone?: string } | { full_name?: string; email?: string; phone?: string }[] | undefined
    const profile = Array.isArray(sp) ? sp[0] : sp
    const teacherRaw = teacher?.profile as { full_name?: string } | { full_name?: string }[] | undefined
    const tp = Array.isArray(teacherRaw) ? teacherRaw[0] : teacherRaw

    // Jedna pozycja na parę uczeń+nauczyciel — tyle powstaje z jednego zapisu.
    const key = `${l.student_id}|${l.teacher_id}`
    const existing = bySeries.get(key)
    if (existing) {
      existing.lessonCount += 1
      continue
    }
    bySeries.set(key, {
      studentId: l.student_id as string,
      studentName: (student.full_name as string) || profile?.full_name || '—',
      email: profile?.email ?? '',
      phone: (student.phone as string) || profile?.phone || '',
      teacherId: l.teacher_id as string,
      teacherName: tp?.full_name ?? '—',
      firstStartsAt: l.starts_at as string,
      durationMinutes: Math.max(
        1,
        Math.round((new Date(l.ends_at as string).getTime() - new Date(l.starts_at as string).getTime()) / 60000)
      ),
      lessonCount: 1,
      meetingUrl: (l.meeting_url as string) ?? '',
      monthlyPrice: student.custom_monthly_price != null ? Number(student.custom_monthly_price) : null,
      createdAt: l.created_at as string,
    })
  }
  return [...bySeries.values()]
}

// Liczba oczekujących zapisów online (do odznaki w panelu admina)
export async function getPendingOnlineBookingsCount(): Promise<number> {
  return (await getPendingOnlineBookings()).length
}

// Kursy/grupy, do których należy uczeń (do profilu Klient 360°)
export type StudentGroup = {
  id: string; name: string; isActive: boolean; scheduleText: string
  teacherName: string; pricePerMonth: number | null; format: string | null
}
export async function getStudentGroups(studentId: string): Promise<StudentGroup[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('group_members')
    .select('group:groups(id, name, is_active, schedule_text, price_per_month, format, teacher:teachers(profile:profiles(full_name)))')
    .eq('student_id', studentId)
  return (data ?? []).map((m) => {
    const g = (Array.isArray(m.group) ? m.group[0] : m.group) as Record<string, unknown> | null
    const teacherRaw = g?.teacher as { profile?: { full_name?: string } | { full_name?: string }[] } | undefined
    const tp = Array.isArray(teacherRaw?.profile) ? teacherRaw?.profile[0] : teacherRaw?.profile
    return {
      id: (g?.id as string) ?? '',
      name: (g?.name as string) ?? '—',
      isActive: (g?.is_active as boolean) ?? false,
      scheduleText: (g?.schedule_text as string) ?? '',
      teacherName: tp?.full_name ?? '—',
      pricePerMonth: g?.price_per_month != null ? Number(g.price_per_month) : null,
      format: (g?.format as string) ?? null,
    }
  }).filter((g) => g.id)
}

export type AdminNotification = {
  id: string; created_at: string; kind: string; title: string; body: string | null
  student_id: string | null; read_at: string | null
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('admin_notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null)
  return count ?? 0
}

export async function getRecentNotifications(limit = 50): Promise<AdminNotification[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data as AdminNotification[]) ?? []
}

// ──────────────────────────────────────────
// SKRZYNKA ZGŁOSZEŃ (panel admina)
// ──────────────────────────────────────────

export type InboxLead = {
  id: string
  createdAt: string
  status: string
  entryPoint: string | null
  firstName: string | null
  parentName: string | null
  email: string | null
  phone: string | null
  studentType: string | null
  studentAge: number | null
  location: string | null
  goal: string | null
  preferredStart: string | null
  groupName: string | null
  campaign: string | null
  firstResponseAt: string | null
}

// Wszystkie otwarte zgłoszenia, niezależnie od tego, którym formularzem
// przyszły. Najdłużej czekające na górze — kolejka ma odpowiadać na pytanie
// „co jest do zrobienia dzisiaj", a nie „co przyszło ostatnie".
export async function getInboxLeads(): Promise<InboxLead[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select(`id, created_at, status, entry_point, first_name, parent_name, email, phone,
             student_type, student_age, location, goal, preferred_start, campaign, first_response_at,
             group:groups(name)`)
    .in('status', ['new', 'contacted', 'qualified', 'booked'])
    .order('created_at', { ascending: true })

  return (data ?? []).map((l) => {
    const group = Array.isArray(l.group) ? l.group[0] : l.group
    return {
      id: l.id as string,
      createdAt: l.created_at as string,
      status: l.status as string,
      entryPoint: (l.entry_point as string) ?? null,
      firstName: (l.first_name as string) ?? null,
      parentName: (l.parent_name as string) ?? null,
      email: (l.email as string) ?? null,
      phone: (l.phone as string) ?? null,
      studentType: (l.student_type as string) ?? null,
      studentAge: l.student_age != null ? Number(l.student_age) : null,
      location: (l.location as string) ?? null,
      goal: (l.goal as string) ?? null,
      preferredStart: (l.preferred_start as string) ?? null,
      groupName: (group as { name?: string } | null)?.name ?? null,
      campaign: (l.campaign as string) ?? null,
      firstResponseAt: (l.first_response_at as string) ?? null,
    }
  })
}

// Liczba zgłoszeń czekających na pierwszy kontakt — do odznaki w menu.
export async function getUnhandledLeadsCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new')
  return count ?? 0
}
