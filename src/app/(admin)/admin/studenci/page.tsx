import { getAllStudents, getStudentHoursMap, getAllTeachersAdmin, getDeletedStudents } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { StudentsTable } from './StudentsTable'

export const dynamic = 'force-dynamic'

// Dzień tygodnia (0=Pon..6=Ndz, konwencja aplikacji) z daty w strefie Europe/Warsaw.
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
function warsawDow(iso: string): number {
  const short = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/Warsaw' }).format(new Date(iso))
  return DOW.indexOf(short)
}

// Godzina „HH:MM" czasu polskiego z daty ISO.
function warsawTime(iso: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
}

export default async function StudenciPage() {
  const supabase = await createClient()
  const nowIso = new Date().toISOString()
  const [students, hoursMap, teachers, deleted, { data: entityData }, { data: lessonRows }, { data: memberRows }] = await Promise.all([
    getAllStudents(),
    getStudentHoursMap(),
    getAllTeachersAdmin(),
    getDeletedStudents(),
    supabase.rpc('list_billing_entities'),
    supabase.from('lessons')
      .select('student_id, starts_at, ends_at, type, meeting_url')
      .is('cancelled_at', null).is('group_id', null).not('student_id', 'is', null),
    supabase.from('group_members').select('student_id, group:groups(is_active)'),
  ])

  const entityOptions = (entityData ?? []) as { id: string; short_name: string; name: string; vat_payer: boolean }[]

  // Mapa uczeń → dni zajęć i typy zajęć (do filtrów) + nadchodzące lekcje (do statusu)
  const daysByStudent: Record<string, Set<number>> = {}
  const typesByStudent: Record<string, Set<string>> = {}
  const hasUpcomingLesson = new Set<string>()
  // Najbliższa do „teraz" lekcja każdego ucznia (przyszła, a w braku — ostatnia
  // minęła) — podpowiedź terminu/linku w edytorze harmonogramu dla uczniów
  // zapisanych jeszcze przed przebudową kreatora, którzy nie mają course_config.
  const closestLesson: Record<string, { starts_at: string; ends_at: string; meeting_url: string | null }> = {}
  for (const l of (lessonRows ?? []) as { student_id: string; starts_at: string; ends_at: string; type: string; meeting_url: string | null }[]) {
    ;(daysByStudent[l.student_id] ??= new Set()).add(warsawDow(l.starts_at))
    ;(typesByStudent[l.student_id] ??= new Set()).add(l.type)
    if (l.starts_at >= nowIso) hasUpcomingLesson.add(l.student_id)

    const cur = closestLesson[l.student_id]
    const isFuture = l.starts_at >= nowIso
    const curIsFuture = cur ? cur.starts_at >= nowIso : false
    const better = !cur
      || (isFuture && !curIsFuture)
      || (isFuture === curIsFuture && (isFuture ? l.starts_at < cur.starts_at : l.starts_at > cur.starts_at))
    if (better) closestLesson[l.student_id] = l
  }

  // Uczniowie będący członkami AKTYWNEGO kursu (grupa is_active = true)
  const inActiveGroup = new Set<string>()
  for (const m of (memberRows ?? []) as { student_id: string; group?: { is_active?: boolean } | { is_active?: boolean }[] }[]) {
    const g = Array.isArray(m.group) ? m.group[0] : m.group
    if (g?.is_active) inActiveGroup.add(m.student_id)
  }
  // Aktywny = ma nadchodzące zajęcia (indywidualne) LUB należy do trwającego kursu.
  // Nieaktywny = brak przypisania do zajęć oraz brak aktywnego kursu (w tym uczniowie
  // wyłącznie w kursie, który się już zakończył).
  const isStudentActive = (id: string) => hasUpcomingLesson.has(id) || inActiveGroup.has(id)

  // Panel Studenci pokazuje TYLKO klientów indywidualnych. Pracownicy firm B2B
  // (np. Democo, Airpress) są widoczni wyłącznie w panelu B2B (Firmy) — kryterium:
  // billing_type = 'b2b' lub przypisana firma (company_id).
  const individualStudents = students.filter((s) => {
    const rec = s as unknown as Record<string, unknown>
    return (s.billing_type ?? 'individual') !== 'b2b' && !rec.company_id
  })

  const rows = individualStudents.map((s) => {
    // Uczniowie zapisani przed przebudową kreatora nie mają course_config —
    // podpowiedź terminu i linku bierzemy wtedy z ich najbliższej co do „teraz"
    // lekcji, żeby edytor harmonogramu nie startował z pustego miejsca.
    const near = closestLesson[s.id]
    const inferredSlot = !s.course_config && near
      ? { day: warsawDow(near.starts_at), time: warsawTime(near.starts_at), durationMin: Math.max(1, Math.round((new Date(near.ends_at).getTime() - new Date(near.starts_at).getTime()) / 60000)) }
      : null

    return {
      id: s.id,
      profileId: s.profile_id,
      name: s.full_name ?? s.profile?.full_name ?? '—',
      email: s.profile?.email ?? '',
      phone: s.profile?.phone ?? '',
      level: s.level,
      status: s.status,
      teacherId: s.teacher_id ?? '',
      teacherName: s.teacher?.profile?.full_name ?? '—',
      hours: Math.round((hoursMap[s.id] ?? 0) * 10) / 10,
      balance: s.credit_balance,
      code: s.referral_code,
      joined: new Date(s.joined_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Warsaw' }),
      billingType: (s.billing_type ?? 'individual') as 'individual' | 'b2b',
      customPrice: s.custom_monthly_price ?? null,
      vatRate: s.vat_rate ?? null,
      nip: s.nip ?? '',
      companyName: s.company_name ?? '',
      ageGroup: s.age_group ?? '',
      customFields: s.custom_fields ?? {},
      legalEntityId: ((s as unknown) as Record<string, unknown>).legal_entity_id as string ?? '',
      lessonDays: Array.from(daysByStudent[s.id] ?? []),
      lessonTypes: Array.from(typesByStudent[s.id] ?? []),
      active: isStudentActive(s.id),
      courseConfig: s.course_config ?? null,
      inferredSlot,
      meetingUrl: s.course_config?.meetingUrl ?? near?.meeting_url ?? '',
      lessonPrice: s.custom_lesson_price ?? null,
      teacherRate: s.custom_teacher_rate ?? null,
    }
  })

  const teacherOptions = teachers.filter((t) => t.is_active).map((t) => ({
    id: t.id,
    name: t.profile?.full_name ?? '—',
    onlineIndividualPayRate: t.online_individual_pay_rate ?? null,
    onlineIndividualClientRate: t.online_individual_client_rate ?? null,
  }))
  const deletedRows = deleted.map((s) => ({ id: s.id, name: s.full_name ?? s.profile?.full_name ?? '—', email: s.profile?.email ?? '' }))

  return <StudentsTable rows={rows} teacherOptions={teacherOptions} deletedRows={deletedRows} entityOptions={entityOptions} />
}
