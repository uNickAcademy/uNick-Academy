import { BarChart3, Clock, BookOpen, Wallet, UserMinus } from 'lucide-react'
import { getAllLessons, getAllTeachersAdmin, getDropouts } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function RaportyPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams
  const now = new Date()
  const defFrom = new Date(now.getFullYear(), now.getMonth(), 1)
  const defTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const from = sp.from || ymd(defFrom)
  const to = sp.to || ymd(defTo)

  const fromISO = new Date(from + 'T00:00:00').toISOString()
  const toISO = new Date(to + 'T23:59:59').toISOString()

  const [lessons, teachers, dropouts] = await Promise.all([
    getAllLessons(fromISO, toISO),
    getAllTeachersAdmin(),
    getDropouts(),
  ])

  // zrealizowane = lekcje, które już się odbyły w zakresie
  const realized = lessons.filter((l) => new Date(l.starts_at).getTime() <= Date.now())
  const hoursOf = (l: { starts_at: string; ends_at: string }) => (new Date(l.ends_at).getTime() - new Date(l.starts_at).getTime()) / 3_600_000

  const totalHours = realized.reduce((a, l) => a + hoursOf(l), 0)
  const byType = { online: realized.filter((l) => l.type === 'online'), offline: realized.filter((l) => l.type === 'offline') }
  const byFormat = { individual: realized.filter((l) => l.format === 'individual'), group: realized.filter((l) => l.format === 'group') }

  const teacherMap = new Map(teachers.map((t) => [t.id, t]))
  const perTeacher: Record<string, { name: string; lessons: number; hours: number; rateInd: number | null; rateGrp: number | null; salary: number }> = {}
  for (const l of realized) {
    const t = teacherMap.get(l.teacher_id)
    perTeacher[l.teacher_id] ??= { name: t?.profile?.full_name ?? '—', lessons: 0, hours: 0, rateInd: t?.hourly_rate ?? null, rateGrp: t?.rate_group ?? null, salary: 0 }
    const row = perTeacher[l.teacher_id]
    const h = hoursOf(l)
    // stawka zależna od formatu: grupowa (jeśli ustawiona) vs indywidualna
    const rate = l.format === 'group' ? (t?.rate_group ?? t?.hourly_rate ?? 0) : (t?.hourly_rate ?? 0)
    row.lessons++; row.hours += h; row.salary += rate * h
  }
  const teacherRows = Object.values(perTeacher).sort((a, b) => b.hours - a.hours)
  const totalPayroll = teacherRows.reduce((a, r) => a + r.salary, 0)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6"><BarChart3 size={22} />Raporty</h1>

      <form method="get" className="flex flex-wrap items-end gap-3 mb-8 bg-white rounded-2xl border border-gray-100 p-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Od</label>
          <input type="date" name="from" defaultValue={from} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Do</label>
          <input type="date" name="to" defaultValue={to} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
        <button type="submit" className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90">Pokaż</button>
      </form>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={BookOpen} label="Zrealizowane lekcje" value={String(realized.length)} />
        <Stat icon={Clock} label="Godziny łącznie" value={`${Math.round(totalHours * 10) / 10}h`} />
        <Stat icon={BookOpen} label="Online / Stacjonarnie" value={`${byType.online.length} / ${byType.offline.length}`} />
        <Stat icon={Wallet} label="Pensje (suma)" value={`${Math.round(totalPayroll).toLocaleString('pl-PL')} zł`} color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Wg rodzaju">
          <Row label="Indywidualne" value={`${byFormat.individual.length} lekcji`} />
          <Row label="Grupowe" value={`${byFormat.group.length} lekcji`} />
          <Row label="Online" value={`${byType.online.length} lekcji · ${Math.round(byType.online.reduce((a, l) => a + hoursOf(l), 0) * 10) / 10}h`} />
          <Row label="Stacjonarne" value={`${byType.offline.length} lekcji · ${Math.round(byType.offline.reduce((a, l) => a + hoursOf(l), 0) * 10) / 10}h`} />
        </Card>
      </div>

      {/* Rozliczenie prowadzących */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Wallet size={18} />Rozliczenie prowadzących</h2>
          <span className="text-sm text-gray-500">Pensje wg godzin × stawka</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Prowadzący</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Lekcje</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Godziny</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stawka</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Do wypłaty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {teacherRows.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">Brak zrealizowanych lekcji w tym okresie.</td></tr>
            ) : teacherRows.map((r) => (
              <tr key={r.name} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{r.name}</td>
                <td className="px-5 py-3 text-gray-700">{r.lessons}</td>
                <td className="px-5 py-3 text-gray-700">{Math.round(r.hours * 10) / 10}h</td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {r.rateInd != null ? `${r.rateInd} zł/h ind.` : 'brak'}{r.rateGrp != null ? ` · ${r.rateGrp} zł/h gr.` : ''}
                </td>
                <td className="px-5 py-3 font-bold text-gray-900">{r.salary > 0 ? `${Math.round(r.salary).toLocaleString('pl-PL')} zł` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wypisani z grup (dropout) */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><UserMinus size={18} className="text-amber-500" />Wypisani z grup</h2>
        </div>
        {dropouts.length === 0 ? (
          <p className="px-6 py-8 text-center text-gray-400 text-sm">Brak wypisań z grup.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Uczeń</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Grupa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kiedy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dropouts.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{d.studentName}</td>
                  <td className="px-5 py-3 text-gray-600">{d.groupName}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(d.removedAt).toLocaleString('pl-PL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-2 text-gray-400"><Icon size={16} /></div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-xl font-black ${color ?? 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  )
}
