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
    levels: (g.levels && g.levels.length > 0 ? g.levels : [g.level]),
    color: g.color,
    isActive: g.is_active,
    teacherId: g.teacher_id ?? '',
    teacherName: g.teacher?.profile?.full_name ?? '—',
    members: (g.members ?? []).map((m) => ({ id: m.id, name: m.full_name ?? m.profile?.full_name ?? '—' })),
    capacity: g.capacity ?? 0,
    scheduleText: g.schedule_text ?? '',
    ageRange: g.age_range ?? '',
    ageMin: g.age_min ?? null,
    ageMax: g.age_max ?? null,
    description: g.description ?? '',
    format: g.format ?? null,
    pricePerMonth: g.price_per_month != null ? Number(g.price_per_month) : null,
    dayOfWeek: g.day_of_week != null ? Number(g.day_of_week) : null,
  }))

  const teacherOptions = teachers.filter((t) => t.is_active).map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—' }))
  const studentOptions = students.map((s) => ({ id: s.id, name: s.full_name ?? s.profile?.full_name ?? '—' }))

  return <GroupsView groups={groupCards} teacherOptions={teacherOptions} studentOptions={studentOptions} />
}
