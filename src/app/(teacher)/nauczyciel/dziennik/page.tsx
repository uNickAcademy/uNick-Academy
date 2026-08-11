import { createClient } from '@/lib/supabase/server'
import { getTeacherByProfileId, getTeacherLessons, getTeacherMakeupQueue } from '@/lib/supabase/queries'
import { RegisterView } from './RegisterView'
import { MakeupQueue } from './MakeupQueue'

export const dynamic = 'force-dynamic'

export default async function TeacherRegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const teacher = await getTeacherByProfileId(user.id)
  if (!teacher) return null

  const from = new Date(Date.now() - 30 * 86400000).toISOString()
  const to = new Date(Date.now() + 14 * 86400000).toISOString()
  const [lessons, makeupQueue] = await Promise.all([
    getTeacherLessons(teacher.id, from, to),
    getTeacherMakeupQueue(teacher.id),
  ])

  const rows = lessons.map((l) => ({
    id: l.id,
    student: l.group ? `${l.group.name} (grupa)` : (l.student?.full_name ?? l.student?.profile?.full_name ?? '—'),
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
        <h1 className="text-2xl font-black text-gray-900">Dziennik</h1>
        <p className="text-gray-500 mt-1">Zaznaczaj obecność, temat lekcji, pracę domową i udostępniaj materiały.</p>
      </div>
      <MakeupQueue items={makeupQueue} />
      <RegisterView rows={rows} teacherId={teacher.id} />
    </div>
  )
}
