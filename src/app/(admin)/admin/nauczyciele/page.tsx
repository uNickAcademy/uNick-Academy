import { getAllTeachersAdmin, getTeacherStatsMap } from '@/lib/supabase/queries'
import { TeachersGrid } from './TeachersGrid'

export const dynamic = 'force-dynamic'

export default async function NauczycieleAdminPage() {
  const [teachers, stats] = await Promise.all([
    getAllTeachersAdmin(),
    getTeacherStatsMap(),
  ])

  const cards = teachers.map((t) => {
    const s = stats[t.id] ?? { students: 0, lessonsWeek: 0, lessonsTotal: 0 }
    return {
      id: t.id,
      name: t.profile?.full_name ?? '—',
      email: t.profile?.email ?? '',
      color: t.color,
      rating: t.rating,
      isActive: t.is_active,
      hourlyRate: t.hourly_rate ?? null,
      rateGroup: t.rate_group ?? null,
      location: t.location ?? '',
      students: s.students,
      lessonsWeek: s.lessonsWeek,
      lessonsTotal: s.lessonsTotal,
    }
  })

  return <TeachersGrid cards={cards} />
}
