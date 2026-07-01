import { getAllLessons, getAllTeachersAdmin, getAllStudents, getHolidays, getAllGroups } from '@/lib/supabase/queries'
import { AdminCalendar } from './AdminCalendar'

export const dynamic = 'force-dynamic'

function startOfWeekUTC(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = (x.getDay() + 6) % 7 // poniedziałek = 0
  x.setDate(x.getDate() - day)
  return x
}

export default async function KalendarzPage() {
  // Tylko bieżący tydzień — pierwszy render, dalsza nawigacja dociąga dane po stronie klienta
  const weekStart = startOfWeekUTC(new Date())
  const from = weekStart.toISOString()
  const to = new Date(weekStart.getTime() + 7 * 86400000).toISOString()

  const [lessons, teachers, students, holidays, groups] = await Promise.all([
    getAllLessons(from, to),
    getAllTeachersAdmin(),
    getAllStudents(),
    getHolidays(),
    getAllGroups(),
  ])

  const teacherMap = new Map(teachers.map((t) => [t.id, t]))

  const calLessons = lessons
    .filter((l) => !(l as unknown as { cancelled_at?: string }).cancelled_at)
    .map((l) => ({
      id: l.id,
      startsAt: l.starts_at,
      endsAt: l.ends_at,
      student: l.group ? l.group.name : (l.student?.profile?.full_name ?? '—'),
      studentId: l.student_id ?? '',
      isGroup: !!l.group_id,
      groupId: l.group_id ?? '',
      teacherId: l.teacher_id,
      teacherName: teacherMap.get(l.teacher_id)?.profile?.full_name ?? '—',
      color: l.group ? l.group.color : (teacherMap.get(l.teacher_id)?.color ?? '#23479E'),
      topic: l.topic ?? '',
      type: l.type,
      meetingUrl: l.meeting_url ?? '',
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
      initialLessons={calLessons}
      initialWeekStart={weekStart.toISOString()}
      teacherOptions={teacherOptions}
      studentOptions={studentOptions}
      groupOptions={groupOptions}
      holidays={holidays}
    />
  )
}
