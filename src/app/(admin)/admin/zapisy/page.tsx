import { getBookingRequests, getAllTeachersAdmin } from '@/lib/supabase/queries'
import { RequestsView } from './RequestsView'

export const dynamic = 'force-dynamic'

const DAYS_PL = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']

export default async function ZapisyAdminPage() {
  const [requests, teachers] = await Promise.all([getBookingRequests(), getAllTeachersAdmin()])

  const rows = requests.map((r) => {
    const slots = (r.available_slots as { day: number; time: string }[] | null) ?? []
    return {
      id: r.id as string,
      createdAt: new Date(r.created_at as string).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      status: r.status as string,
      fullName: r.full_name as string,
      email: r.email as string,
      phone: (r.phone as string) ?? '',
      level: r.level as string,
      age: (r.age as number) ?? null,
      address: r.address as string,
      notes: (r.notes as string) ?? '',
      slots: slots.map((s) => `${DAYS_PL[s.day] ?? '?'} ${s.time}`),
      approvedRate: (r.approved_rate as number) ?? null,
    }
  })

  const teacherOptions = teachers.filter((t) => t.is_active).map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—' }))

  return <RequestsView rows={rows} teacherOptions={teacherOptions} />
}
