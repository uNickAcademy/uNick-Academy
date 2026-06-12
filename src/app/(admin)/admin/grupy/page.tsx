import { getAllGroups, getAllTeachersAdmin, getAllStudents } from '@/lib/supabase/queries'
import { GroupsView } from './GroupsView'

export const dynamic = 'force-dynamic'

export default async function GrupyPage() {
  const [groups, teachers, students] = await Promise.all([
    getAllGroups(),
    getAllTeachersAdmin(),
    getAllStudents(),
  ])

  const groupCards = groups.map((g) => ({
    id: g.id,
    name: g.name,
    level: g.level,
    color: g.color,
    isActive: g.is_active,
    teacherName: g.teacher?.profile?.full_name ?? '—',
    members: (g.members ?? []).map((m) => ({ id: m.id, name: m.profile?.full_name ?? '—' })),
  }))

  const teacherOptions = teachers.filter((t) => t.is_active).map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—' }))
  const studentOptions = students.map((s) => ({ id: s.id, name: s.profile?.full_name ?? '—' }))

  return <GroupsView groups={groupCards} teacherOptions={teacherOptions} studentOptions={studentOptions} />
}
