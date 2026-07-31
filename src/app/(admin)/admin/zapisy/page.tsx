import { getBookingRequests, getAllTeachersAdmin, getPendingOnlineBookings } from '@/lib/supabase/queries'
import { RequestsView } from './RequestsView'
import { OnlineBookingsView } from './OnlineBookingsView'

export const dynamic = 'force-dynamic'

const DAYS_PL = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz']

// Wartość dla <input type="datetime-local"> w czasie polskim — bez tego
// formularz pokazywałby UTC i admin zatwierdzałby przesunięty termin.
function toLocalInput(iso: string): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

export default async function ZapisyAdminPage() {
  const [requests, teachers, onlinePending] = await Promise.all([
    getBookingRequests(),
    getAllTeachersAdmin(),
    getPendingOnlineBookings(),
  ])

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

  const onlineRows = onlinePending.map((b) => ({
    studentId: b.studentId,
    studentName: b.studentName,
    email: b.email,
    phone: b.phone,
    teacherId: b.teacherId,
    teacherName: b.teacherName,
    firstStartsAtLabel: new Date(b.firstStartsAt).toLocaleString('pl-PL', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw',
    }),
    firstStartsAtInput: toLocalInput(b.firstStartsAt),
    lessonCount: b.lessonCount,
    meetingUrl: b.meetingUrl,
    monthlyPrice: b.monthlyPrice,
    createdAt: new Date(b.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }))

  const teacherOptions = teachers.filter((t) => t.is_active).map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—' }))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Zapisy do zatwierdzenia</h1>
        <p className="text-gray-500 mt-1">Potwierdź nauczyciela, termin i link do zajęć — uczeń dostanie płatność mailem</p>
      </div>

      <section id="online" className="mb-10 scroll-mt-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">
          Zapisy online{onlineRows.length > 0 ? ` (${onlineRows.length})` : ''}
        </h2>
        <OnlineBookingsView rows={onlineRows} teacherOptions={teacherOptions} />
      </section>

      <section id="stacjonarne" className="scroll-mt-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Prośby o zajęcia stacjonarne</h2>
        <RequestsView rows={rows} teacherOptions={teacherOptions} />
      </section>
    </div>
  )
}
