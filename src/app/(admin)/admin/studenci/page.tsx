import { getAllStudents, getStudentHoursMap, getAllTeachers, getDeletedStudents } from '@/lib/supabase/queries'
import { StudentsTable } from './StudentsTable'

export const dynamic = 'force-dynamic'

export default async function StudenciPage() {
  const [students, hoursMap, teachers, deleted] = await Promise.all([
    getAllStudents(),
    getStudentHoursMap(),
    getAllTeachers(),
    getDeletedStudents(),
  ])

  const rows = students.map((s) => ({
    id: s.id,
    profileId: s.profile_id,
    name: s.profile?.full_name ?? '—',
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
    billingType: s.billing_type ?? 'individual',
    customPrice: s.custom_monthly_price ?? null,
    vatRate: s.vat_rate ?? null,
    nip: s.nip ?? '',
    companyName: s.company_name ?? '',
    ageGroup: s.age_group ?? '',
    customFields: s.custom_fields ?? {},
  }))

  const teacherOptions = teachers.map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—' }))
  const deletedRows = deleted.map((s) => ({ id: s.id, name: s.profile?.full_name ?? '—', email: s.profile?.email ?? '' }))

  return <StudentsTable rows={rows} teacherOptions={teacherOptions} deletedRows={deletedRows} />
}
