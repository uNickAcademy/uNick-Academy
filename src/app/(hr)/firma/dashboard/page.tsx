import Link from 'next/link'
import { Users, Calendar, AlertCircle, FileText, CheckCircle, XCircle } from 'lucide-react'
import { getHrCompany, getHrEmployees, getHrLessons, getHrInvoices } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function HrDashboard() {
  const [company, employees, upcoming, invoices] = await Promise.all([
    getHrCompany(),
    getHrEmployees(),
    getHrLessons(new Date().toISOString(), new Date(Date.now() + 7 * 86400000).toISOString()),
    getHrInvoices(),
  ])

  const owed = employees.reduce((acc, e) => acc + (e.credit_balance < 0 ? -e.credit_balance : 0), 0)
  const pastMonth = await getHrLessons(new Date(Date.now() - 30 * 86400000).toISOString(), new Date().toISOString())
  const present = pastMonth.filter((l) => l.attendance === 'present').length
  const absent = pastMonth.filter((l) => l.attendance === 'absent').length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">{company?.name ?? 'Panel firmy'}</h1>
        <p className="text-gray-500 mt-1">Przegląd nauki Twoich pracowników</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={Users} label="Pracownicy" value={String(employees.length)} />
        <Stat icon={Calendar} label="Lekcje (7 dni)" value={String(upcoming.length)} />
        <Stat icon={AlertCircle} label="Zaległości" value={`${owed.toLocaleString('pl-PL')} zł`} color="text-red-500" />
        <Stat icon={FileText} label="Faktury" value={String(invoices.length)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Frekwencja (30 dni)</h2>
          <div className="flex gap-6">
            <div className="flex items-center gap-2"><CheckCircle size={18} className="text-green-600" /><div><p className="text-xl font-black text-gray-900">{present}</p><p className="text-xs text-gray-500">obecności</p></div></div>
            <div className="flex items-center gap-2"><XCircle size={18} className="text-red-500" /><div><p className="text-xl font-black text-gray-900">{absent}</p><p className="text-xs text-gray-500">nieobecności</p></div></div>
          </div>
          <Link href="/firma/pracownicy" className="inline-block mt-4 text-sm text-[#23479E] font-medium hover:underline">Zobacz pracowników →</Link>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Najbliższe lekcje</h2>
          {upcoming.length === 0 ? <p className="text-sm text-gray-400">Brak zaplanowanych lekcji.</p> : (
            <div className="space-y-2">
              {upcoming.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                  <div className="text-xs font-bold text-[#23479E] w-12">{new Date(l.starts_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{l.student?.profile?.full_name}</p>
                    <p className="text-xs text-gray-500">{new Date(l.starts_at).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })} · {l.teacher?.profile?.full_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="w-10 h-10 rounded-xl bg-[#EAF3FF] text-[#23479E] flex items-center justify-center mb-3"><Icon size={18} /></div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-xl font-black ${color ?? 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
