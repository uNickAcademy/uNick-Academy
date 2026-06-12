import { getAllLessons, getAllTeachersAdmin } from '@/lib/supabase/queries'
import { LessonsTable } from './LessonsTable'

export const dynamic = 'force-dynamic'

export default async function LekcjeAdminPage() {
  const from = new Date(Date.now() - 30 * 86400000).toISOString()
  const to = new Date(Date.now() + 60 * 86400000).toISOString()

  const [lessons, teachers] = await Promise.all([
    getAllLessons(from, to),
    getAllTeachersAdmin(),
  ])

  const rows = lessons.map((l) => ({
    id: l.id,
    student: l.group ? `${l.group.name} (grupa)` : (l.student?.profile?.full_name ?? '—'),
    teacherId: l.teacher_id,
    teacher: l.teacher?.profile?.full_name ?? '—',
    startsAt: l.starts_at,
    endsAt: l.ends_at,
    topic: l.topic ?? '',
    level: l.level,
    type: l.type,
  }))

  const teacherOptions = teachers.map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—' }))

  return <LessonsTable rows={rows} teacherOptions={teacherOptions} />
}
