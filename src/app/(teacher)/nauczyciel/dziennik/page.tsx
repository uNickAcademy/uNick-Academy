import { createClient } from '@/lib/supabase/server'
import { getTeacherByProfileId, getTeacherLessons } from '@/lib/supabase/queries'
import { RegisterView } from './RegisterView'

export const dynamic = 'force-dynamic'

export default async function TeacherRegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const teacher = await getTeacherByProfileId(user.id)
  if (!teacher) return null

  const from = new Date(Date.now() - 30 * 86400000).toISOString()
  const to = new Date(Date.now() + 14 * 86400000).toISOString()
  const lessons = await getTeacherLessons(teacher.id, from, to)

  const rows = lessons.map((l) => ({
    id: l.id,
    student: l.group ? `${l.group.name} (grupa)` : (l.student?.profile?.full_name ?? '—'),
    startsAt: l.starts_at,
    endsAt: l.ends_at,
    type: l.type,
    level: l.level,
    topic: l.topic ?? '',
    homework: l.homework ?? '',
    meetingUrl: l.meeting_url ?? '',
    attendance: l.attendance ?? 'scheduled',
    materials: (l.materials ?? []).map((m) => ({ id: m.id, title: m.title, url: m.url })),
  }))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Register</h1>
        <p className="text-gray-500 mt-1">Mark attendance, lesson topics, homework and share materials.</p>
      </div>
      <RegisterView rows={rows} teacherId={teacher.id} />
    </div>
  )
}
