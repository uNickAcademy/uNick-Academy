import { getAllStudents, getStudentHoursMap, getAllTeachers, getDeletedStudents } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { StudentsTable } from './StudentsTable'

export const dynamic = 'force-dynamic'

// Dzień tygodnia (0=Pon..6=Ndz, konwencja aplikacji) z daty w strefie Europe/Warsaw.
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
function warsawDow(iso: string): number {
  const short = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/Warsaw' }).format(new Date(iso))
  return DOW.indexOf(short)
}

export default async function StudenciPage() {
  const supabase = await createClient()
  const [students, hoursMap, teachers, deleted, { data: entityData }, { data: lessonRows }] = await Promise.all([
    getAllStudents(),
    getStudentHoursMap(),
    getAllTeachers(),
    getDeletedStudents(),
    supabase.rpc('list_billing_entities'),
    supabase.from('lessons').select('student_id, starts_at, type').is('cancelled_at', null).not('student_id', 'is', null),
  ])

  const entityOptions = (entityData ?? []) as { id: string; short_name: string; name: string; vat_payer: boolean }[]

  // Mapa uczeń → dni zajęć i typy zajęć (do filtrów), liczona z jego lekcji
  const daysByStudent: Record<string, Set<number>> = {}
  const typesByStudent: Record<string, Set<string>> = {}
  for (const l of (lessonRows ?? []) as { student_id: string; starts_at: string; type: string }[]) {
    ;(daysByStudent[l.student_id] ??= new Set()).add(warsawDow(l.starts_at))
    ;(typesByStudent[l.student_id] ??= new Set()).add(l.type)
  }

  // Panel Studenci pokazuje TYLKO klientów indywidualnych. Pracownicy firm B2B
  // (np. Democo, Airpress) są widoczni wyłącznie w panelu B2B (Firmy) — kryterium:
  // billing_type = 'b2b' lub przypisana firma (company_id).
  const individualStudents = students.filter((s) => {
    const rec = s as unknown as Record<string, unknown>
    return (s.billing_type ?? 'individual') !== 'b2b' && !rec.company_id
  })

  const rows = individualStudents.map((s) => ({
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
  }))

  const teacherOptions = teachers.map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—' }))
  const deletedRows = deleted.map((s) => ({ id: s.id, name: s.full_name ?? s.profile?.full_name ?? '—', email: s.profile?.email ?? '' }))

  return <StudentsTable rows={rows} teacherOptions={teacherOptions} deletedRows={deletedRows} entityOptions={entityOptions} />
}
