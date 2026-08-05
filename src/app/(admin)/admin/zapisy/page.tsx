import { getBookingRequests, getAllTeachersAdmin, getPendingOnlineBookings, getInboxLeads, getHolidays } from '@/lib/supabase/queries'
import { expandBreaks, dayOfWeek } from '@/lib/lessons/schedule'
import { RequestsView } from './RequestsView'
import { OnlineBookingsView } from './OnlineBookingsView'
import { InboxView } from './InboxView'

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
  const [requests, teachers, onlinePending, inbox, holidays] = await Promise.all([
    getBookingRequests(),
    getAllTeachersAdmin(),
    getPendingOnlineBookings(),
    getInboxLeads(),
    getHolidays(),
  ])

  // Przerwy szkolne pokazujemy w podglądzie kursu, żeby liczba lekcji i wartość
  // widoczne w formularzu zgadzały się z tym, co policzy serwer.
  const breakDates = expandBreaks(
    holidays.map((h) => ({ start_date: String(h.start_date), end_date: String(h.end_date) })),
  )

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
    // Rozbite na dzień/datę/godzinę czasu polskiego — z tego formularz układa
    // pierwszy termin tygodniowy i początek kursu.
    firstDate: toLocalInput(b.firstStartsAt).slice(0, 10),
    firstTime: toLocalInput(b.firstStartsAt).slice(11, 16),
    firstDay: dayOfWeek(toLocalInput(b.firstStartsAt).slice(0, 10)),
    durationMinutes: b.durationMinutes,
    lessonCount: b.lessonCount,
    meetingUrl: b.meetingUrl,
    monthlyPrice: b.monthlyPrice,
    createdAt: new Date(b.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }))

  const teacherOptions = teachers.filter((t) => t.is_active).map((t) => ({ id: t.id, name: t.profile?.full_name ?? '—' }))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Zapisy</h1>
        <p className="text-gray-500 mt-1">Wszystkie zgłoszenia w jednym miejscu — najdłużej czekające na górze</p>
      </div>

      <section id="skrzynka" className="mb-10 scroll-mt-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">
          Skrzynka zgłoszeń{inbox.length > 0 ? ` (${inbox.length})` : ''}
        </h2>
        <InboxView rows={inbox} />
      </section>

      <section id="online" className="mb-10 scroll-mt-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">
          Zapisy online — do zatwierdzenia{onlineRows.length > 0 ? ` (${onlineRows.length})` : ''}
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Zgłoszenia sprzed przebudowy kreatora. Nowe zajęcia indywidualne trafiają do skrzynki wyżej.
        </p>
        <OnlineBookingsView rows={onlineRows} teacherOptions={teacherOptions} breakDates={breakDates} />
      </section>

      <section id="stacjonarne" className="scroll-mt-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Prośby o zajęcia stacjonarne (archiwalne)</h2>
        <RequestsView rows={rows} teacherOptions={teacherOptions} />
      </section>
    </div>
  )
}
