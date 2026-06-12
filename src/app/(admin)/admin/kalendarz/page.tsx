import { getAllLessons, getAllTeachersAdmin, getAllStudents, getHolidays, getAllGroups } from '@/lib/supabase/queries'
import { AdminCalendar } from './AdminCalendar'

export const dynamic = 'force-dynamic'

export default async function KalendarzPage() {
  const from = new Date(Date.now() - 14 * 86400000).toISOString()
  const to = new Date(Date.now() + 60 * 86400000).toISOString()

  const [lessons, teachers, students, holidays, groups] = await Promise.all([
    getAllLessons(from, to),
    getAllTeachersAdmin(),
    getAllStudents(),
    getHolidays(),
    getAllGroups(),
  ])

  const teacherMap = new Map(teachers.map((t) => [t.id, t]))

  const calLessons = lessons.map((l) => ({
    id: l.id,
    startsAt: l.starts_at,
    endsAt: l.ends_at,
    student: l.group ? l.group.name : (l.student?.profile?.full_name ?? '—'),
    isGroup: !!l.group_id,
    teacherId: l.teacher_id,
    teacherName: teacherMap.get(l.teacher_id)?.profile?.full_name ?? '—',
    color: l.group ? l.group.color : (teacherMap.get(l.teacher_id)?.color ?? '#23479E'),
    topic: l.topic ?? '',
    type: l.type,
  }))

  const teacherOptions = teachers
    .filter((t) => t.is_active)
    .map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—', color: t.color, location: t.location ?? '' }))

  const studentOptions = students.map((s) => ({
    id: s.id,
    name: s.profile?.full_name ?? '—',
    level: s.level,
    teacherId: s.teacher_id ?? '',
  }))

  const groupOptions = groups
    .filter((g) => g.is_active)
    .map((g) => ({ id: g.id, name: g.name, level: g.level, teacherId: g.teacher_id ?? '' }))

  return (
    <AdminCalendar
      lessons={calLessons}
      teacherOptions={teacherOptions}
      studentOptions={studentOptions}
      groupOptions={groupOptions}
      holidays={holidays}
    />
  )
}
