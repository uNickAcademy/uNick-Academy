import { redirect } from 'next/navigation'
import { CheckCircle, XCircle, MinusCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getStudentByProfileId, getStudentLessons } from '@/lib/supabase/queries'
import { getLang } from '@/lib/lang'
import { t } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export default async function PostepyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lang = await getLang()
  const student = await getStudentByProfileId(user.id)
  if (!student) return <div className="p-6 max-w-3xl mx-auto"><p className="text-gray-500">{t(lang, 'no_progress_yet')}</p></div>

  const lessons = await getStudentLessons(student.id)
  const now = new Date()
  const past = lessons.filter((l) => new Date(l.starts_at) < now)
  // Do „nauki” liczymy tylko faktycznie odbyte lekcje (obecność; zakończone bez oznaczenia = obecność)
  const attended = past.filter((l) => l.attendance === 'present' || l.attendance === 'scheduled')

  const locale = lang === 'en' ? 'en-GB' : 'pl-PL'

  // Godziny nauki w ostatnich 6 miesiącach
  const months: { label: string; hours: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const hours = attended
      .filter((l) => { const s = new Date(l.starts_at); return s >= d && s < next })
      .reduce((sum, l) => sum + (new Date(l.ends_at).getTime() - new Date(l.starts_at).getTime()) / 3_600_000, 0)
    months.push({ label: d.toLocaleDateString(locale, { month: 'short' }), hours: Math.round(hours * 10) / 10 })
  }
  const totalHours = months.reduce((s, m) => s + m.hours, 0)
  const maxHours = Math.max(...months.map((m) => m.hours), 1)

  // Frekwencja
  const present = past.filter((l) => l.attendance === 'present' || l.attendance === 'scheduled').length
  const excused = past.filter((l) => l.attendance === 'excused').length
  const lateCancel = past.filter((l) => l.attendance === 'late_cancellation').length
  const noShow = past.filter((l) => l.attendance === 'absent' || l.attendance === 'no_show').length

  // Tematy i notatki
  const recentTopics = past
    .filter((l) => l.topic)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
    .slice(0, 6)
  const notes = past
    .filter((l) => l.notes)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
    .slice(0, 6)

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">{t(lang, 'my_progress')}</h1>

      {past.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <p className="text-gray-400">{t(lang, 'no_progress_yet')}</p>
        </div>
      ) : (
        <>
          {/* Wykres słupkowy */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <h2 className="font-bold text-gray-900 mb-1">{t(lang, 'monthly_hours')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t(lang, 'total_this_period')}: {Math.round(totalHours)}h</p>
            <div className="flex items-end gap-3 h-32">
              {months.map(({ label, hours }) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-600">{hours}h</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: 96 }}>
                    <div
                      className="w-full rounded-t-lg gradient-primary transition-all"
                      style={{ height: `${(hours / maxHours) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Frekwencja */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">{t(lang, 'attendance_title')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AttStat icon={CheckCircle} tone="text-green-600 bg-green-50" label={t(lang, 'att_present')} value={present} />
              <AttStat icon={MinusCircle} tone="text-amber-600 bg-amber-50" label={t(lang, 'att_excused')} value={excused} />
              <AttStat icon={Clock} tone="text-orange-600 bg-orange-50" label={t(lang, 'att_late_cancellation')} value={lateCancel} />
              <AttStat icon={XCircle} tone="text-red-500 bg-red-50" label={t(lang, 'att_no_show')} value={noShow} />
            </div>
          </div>

          {/* Ostatnie tematy */}
          {recentTopics.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
              <h2 className="font-bold text-gray-900 mb-4">{t(lang, 'recent_topics')}</h2>
              <div className="space-y-3">
                {recentTopics.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm font-medium text-gray-800">{l.topic}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-3">{fmtDate(l.starts_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notatki od nauczyciela */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">{t(lang, 'teacher_notes')}</h2>
            {notes.length === 0 ? (
              <p className="text-sm text-gray-400">{t(lang, 'no_notes_yet')}</p>
            ) : (
              <div className="space-y-4">
                {notes.map((l) => (
                  <div key={l.id} className="border-l-2 border-violet-200 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#23479E]">{l.teacher?.profile?.full_name ?? '—'}</span>
                      <span className="text-xs text-gray-400">{fmtDate(l.starts_at)}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{l.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function AttStat({ icon: Icon, tone, label, value }: {
  icon: typeof CheckCircle
  tone: string
  label: string
  value: number
}) {
  return (
    <div className="text-center">
      <div className={`w-10 h-10 rounded-xl ${tone} flex items-center justify-center mx-auto mb-2`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
