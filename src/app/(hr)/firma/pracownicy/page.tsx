import { getHrEmployees, getHrLessons } from '@/lib/supabase/queries'
import { EmployeesView } from './EmployeesView'

export const dynamic = 'force-dynamic'

export default async function HrEmployeesPage() {
  const from = new Date(Date.now() - 30 * 86400000).toISOString()
  const to = new Date(Date.now() + 30 * 86400000).toISOString()
  const [employees, lessons] = await Promise.all([getHrEmployees(), getHrLessons(from, to)])

  const now = Date.now()
  const rows = employees.map((e) => {
    const theirLessons = lessons.filter((l) => l.student_id === e.id)
    const past = theirLessons.filter((l) => new Date(l.starts_at).getTime() < now)
    return {
      id: e.id,
      name: e.profile?.full_name ?? '—',
      email: e.profile?.email ?? '',
      level: e.level,
      balance: e.credit_balance,
      teacherName: e.teacher?.profile?.full_name ?? '—',
      teacherId: e.teacher_id ?? '',
      present: past.filter((l) => l.attendance === 'present').length,
      absent: past.filter((l) => l.attendance === 'absent').length,
      upcoming: theirLessons
        .filter((l) => new Date(l.starts_at).getTime() >= now)
        .map((l) => ({
          id: l.id, startsAt: l.starts_at, endsAt: l.ends_at,
          topic: l.topic ?? '', teacherId: l.teacher_id,
          teacherName: l.teacher?.profile?.full_name ?? '—', type: l.type,
        })),
    }
  })

  return <EmployeesView rows={rows} />
}
