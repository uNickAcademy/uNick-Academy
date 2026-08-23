import { createClient } from '@/lib/supabase/server'
import { getTeacherByProfileId, getTeacherLessons } from '@/lib/supabase/queries'
import { lessonPay } from '@/lib/payroll/lesson-pay'
import { calculateNetPayout, CONTRACT_TYPE_LABELS } from '@/lib/payroll/pl-zlecenie'
import { redirect } from 'next/navigation'
import { AlertTriangle, Wallet } from 'lucide-react'
import type { AttendanceStatus } from '@/types'

export const dynamic = 'force-dynamic'

// Lekcje liczone jako odbyte i płatne: obecność, późne odwołanie, no-show.
// Odwołane w terminie (excused, do odrobienia) nie są rozliczane lektorowi.
const BILLABLE: AttendanceStatus[] = ['present', 'late_cancellation', 'no_show']

export default async function TeacherEarningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const teacher = await getTeacherByProfileId(user.id)
  if (!teacher) return null

  const from = new Date()
  from.setMonth(from.getMonth() - 5, 1)
  from.setHours(0, 0, 0, 0)
  const lessons = await getTeacherLessons(teacher.id, from.toISOString(), new Date().toISOString())

  // Model "domyślnie obecny": miniona lekcja bez oznaczenia (scheduled) liczy się
  // jak obecność — cron dopiero z opóźnieniem przestawia ją na present, a zarobki
  // muszą być spójne z dziennikiem od razu.
  const billable = lessons.filter((l) => {
    const att = l.attendance ?? 'scheduled'
    return BILLABLE.includes(att) || att === 'scheduled'
  })

  const now = new Date()
  const months: { key: string; label: string; gross: number; hours: number; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({ key, label: d.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }), gross: 0, hours: 0, count: 0 })
  }
  const byKey = new Map(months.map((m) => [m.key, m]))

  for (const l of billable) {
    const d = new Date(l.starts_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const m = byKey.get(key)
    if (!m) continue
    const hours = (new Date(l.ends_at).getTime() - new Date(l.starts_at).getTime()) / 3_600_000
    m.gross += lessonPay(l, teacher.pay_rate_30min)
    m.hours += hours
    m.count += 1
  }

  const contractType = teacher.contract_type ?? 'b2b'
  const rows = months.map((m) => ({ ...m, payout: calculateNetPayout(m.gross, contractType) })).reverse()
  const currentMonth = rows[0]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Moje zarobki</h1>
        <p className="text-gray-500 mt-1">Szacunkowe rozliczenie na podstawie odbytych lekcji.</p>
      </div>

      <div className="gradient-primary rounded-2xl p-6 text-white mb-6">
        <p className="text-white/70 text-sm font-medium mb-1">{currentMonth.label} (bieżący miesiąc, w trakcie)</p>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-3xl font-black">{currentMonth.payout.net.toFixed(2)} zł</p>
            <p className="text-white/80 text-sm mt-1">{currentMonth.count} lekcji · {currentMonth.hours.toFixed(1)}h</p>
          </div>
          <div className="flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-xl text-sm font-semibold">
            <Wallet size={16} />
            {CONTRACT_TYPE_LABELS[contractType]}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Historia (6 miesięcy)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400">
                <th className="text-left py-2 px-6 font-medium">Miesiąc</th>
                <th className="text-right py-2 font-medium">Lekcje</th>
                <th className="text-right py-2 font-medium">Godziny</th>
                <th className="text-right py-2 font-medium">Brutto</th>
                {contractType === 'zlecenie' && <th className="text-right py-2 font-medium">ZUS + podatek</th>}
                <th className="text-right py-2 px-6 font-medium">Netto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.key} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 px-6 font-medium text-gray-800 capitalize">{m.label}</td>
                  <td className="py-3 text-right text-gray-500">{m.count}</td>
                  <td className="py-3 text-right text-gray-500">{m.hours.toFixed(1)}h</td>
                  <td className="py-3 text-right text-gray-500">{m.payout.gross.toFixed(2)} zł</td>
                  {contractType === 'zlecenie' && (
                    <td className="py-3 text-right text-red-500">
                      -{(m.payout.zusSocial + m.payout.healthContribution + m.payout.pitAdvance).toFixed(2)} zł
                    </td>
                  )}
                  <td className="py-3 px-6 text-right font-bold text-gray-900">{m.payout.net.toFixed(2)} zł</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-400">
        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
        <p>
          To orientacyjne wyliczenie na podstawie stawki i typu umowy zapisanych w systemie — nie zastępuje rozliczenia
          księgowego. Lekcje odwołane z wyprzedzeniem (do odrobienia) nie są tu liczone; późne odwołania i nieobecności
          bez zgłoszenia liczą się jak odbyte. Pytania o stawkę lub typ umowy kieruj do biura.
        </p>
      </div>
    </div>
  )
}
