import { getAllStudents, getStudentHoursMap, getAllTeachers, getDeletedStudents } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { StudentsTable } from './StudentsTable'

export const dynamic = 'force-dynamic'

export default async function StudenciPage() {
  const supabase = await createClient()
  const [students, hoursMap, teachers, deleted, { data: entityData }] = await Promise.all([
    getAllStudents(),
    getStudentHoursMap(),
    getAllTeachers(),
    getDeletedStudents(),
    supabase.rpc('list_billing_entities'),
  ])

  const entityOptions = (entityData ?? []) as { id: string; short_name: string; name: string; vat_payer: boolean }[]

  const rows = students.map((s) => ({
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
    joined: new Date(s.joined_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' }),
    billingType: (s.billing_type ?? 'individual') as 'individual' | 'b2b',
    customPrice: s.custom_monthly_price ?? null,
    vatRate: s.vat_rate ?? null,
    nip: s.nip ?? '',
    companyName: s.company_name ?? '',
    ageGroup: s.age_group ?? '',
    customFields: s.custom_fields ?? {},
    legalEntityId: ((s as unknown) as Record<string, unknown>).legal_entity_id as string ?? '',
  }))

  const teacherOptions = teachers.map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—' }))
  const deletedRows = deleted.map((s) => ({ id: s.id, name: s.full_name ?? s.profile?.full_name ?? '—', email: s.profile?.email ?? '' }))

  return <StudentsTable rows={rows} teacherOptions={teacherOptions} deletedRows={deletedRows} entityOptions={entityOptions} />
}
