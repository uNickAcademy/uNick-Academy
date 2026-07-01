import { getHrEmployees, getHrLessons, getAllTeachersAdmin } from '@/lib/supabase/queries'
import { EmployeesView } from './EmployeesView'

export const dynamic = 'force-dynamic'

type LessonExtra = { cancelled_at?: string | null; reschedule_count?: number }

export default async function HrEmployeesPage() {
  const from = new Date(Date.now() - 30 * 86400000).toISOString()
  const to = new Date(Date.now() + 30 * 86400000).toISOString()
  const [employees, lessons, teachers] = await Promise.all([getHrEmployees(), getHrLessons(from, to), getAllTeachersAdmin()])
  const teacherOptions = teachers.filter((t) => t.is_active).map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—' }))

  const now = Date.now()
  const rows = employees.map((e) => {
    const theirLessons = lessons.filter((l) => l.student_id === e.id)
    const active = theirLessons.filter((l) => !(l as unknown as LessonExtra).cancelled_at)
    const past = active.filter((l) => new Date(l.starts_at).getTime() < now)
    const cancelled = theirLessons.filter((l) => (l as unknown as LessonExtra).cancelled_at)
    const lateCancelled = cancelled.filter((l) => {
      const ca = (l as unknown as LessonExtra).cancelled_at
      if (!ca) return false
      return new Date(ca).getTime() > new Date(l.starts_at).getTime() - 24 * 3600 * 1000
    })
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
      rescheduled: past.filter((l) => ((l as unknown as LessonExtra).reschedule_count ?? 0) > 0).length,
      lateCancelled: lateCancelled.length,
      upcoming: active
        .filter((l) => new Date(l.starts_at).getTime() >= now)
        .map((l) => ({
          id: l.id, startsAt: l.starts_at, endsAt: l.ends_at,
          topic: l.topic ?? '', teacherId: l.teacher_id,
          teacherName: l.teacher?.profile?.full_name ?? '—', type: l.type,
        })),
    }
  })

  return <EmployeesView rows={rows} teacherOptions={teacherOptions} />
}
