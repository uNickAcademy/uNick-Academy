import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendar, Clock, TrendingUp, Wallet, Video } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getStudentByProfileId, getStudentLessons } from '@/lib/supabase/queries'
import { getLang } from '@/lib/lang'
import { t, type Lang } from '@/lib/i18n'
import { CopyButton } from '../CopyButton'

export const dynamic = 'force-dynamic'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lang = await getLang()
  const student = await getStudentByProfileId(user.id)
  if (!student) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <p className="font-bold text-gray-900 mb-1">
            {lang === 'en' ? 'No student profile linked to this account yet' : 'Do tego konta nie jest jeszcze podpięty profil ucznia'}
          </p>
          <p className="text-sm text-gray-500">
            {lang === 'en'
              ? 'Contact us at hello@unick-academy.pl and we will set it up.'
              : 'Napisz do nas na hello@unick-academy.pl — skonfigurujemy go dla Ciebie.'}
          </p>
        </div>
      </div>
    )
  }

  const isB2b = student.billing_type === 'b2b'
  const lessons = await getStudentLessons(student.id)
  const now = Date.now()
  const upcoming = lessons.filter((l) => new Date(l.starts_at).getTime() >= now)
  const past = lessons.filter((l) => new Date(l.starts_at).getTime() < now)
  const hoursDone = past
    .filter((l) => l.attendance === 'present' || l.attendance === 'scheduled')
    .reduce((sum, l) => sum + (new Date(l.ends_at).getTime() - new Date(l.starts_at).getTime()) / 3_600_000, 0)
  const next = upcoming[0]
  const balance = Number(student.credit_balance ?? 0)

  const locale = lang === 'en' ? 'en-GB' : 'pl-PL'
  const firstName = (student.full_name ?? student.profile?.full_name ?? '').split(' ')[0] || '👋'
  // timeZone jawnie: render server-side na Vercel działa w UTC — bez tego godziny
  // lekcji przesuwają się o 1-2h względem czasu polskiego.
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' })
  const fmtShort = (iso: string) => new Date(iso).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Warsaw' })
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">{t(lang, 'welcome')}, {firstName}! 👋</h1>
        <p className="text-gray-500 mt-1">{t(lang, 'upcoming_count').replace('{n}', String(upcoming.length))}</p>
      </div>

      {/* Następna lekcja – wyróżniona */}
      <div className="gradient-primary rounded-2xl p-6 text-white mb-6">
        <p className="text-white/70 text-sm font-medium mb-1">{t(lang, 'next_lesson')}</p>
        {next ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black capitalize">{fmtDate(next.starts_at)}</h2>
              <p className="text-white/80 mt-1">
                {fmtTime(next.starts_at)} · {next.teacher?.profile?.full_name ?? '—'} · {next.type === 'online' ? t(lang, 'online') : t(lang, 'offline')}
              </p>
            </div>
            {next.type === 'online' && next.meeting_url && (
              <a
                href={next.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
              >
                <Video size={16} />
                {t(lang, 'join')}
              </a>
            )}
          </div>
        ) : (
          <p className="text-white/90">{t(lang, 'no_next_lesson')}</p>
        )}
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Clock} label={t(lang, 'hours_done')} value={`${Math.round(hoursDone)}h`} />
        <StatCard icon={TrendingUp} label={t(lang, 'current_level')} value={student.level} />
        {!isB2b && (
          <StatCard
            icon={Wallet}
            label={t(lang, 'account_balance')}
            value={`${balance > 0 ? '+' : ''}${Math.round(balance)} zł`}
            tone={balance < 0 ? 'red' : balance > 0 ? 'green' : undefined}
          />
        )}
        <StatCard icon={Calendar} label={t(lang, 'scheduled')} value={String(upcoming.length)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nadchodzące lekcje */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{t(lang, 'upcoming')}</h3>
            <Link href="/lekcje" className="text-xs text-[#23479E] font-medium hover:underline">{t(lang, 'see_all')}</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400">{t(lang, 'no_upcoming')}</p>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 4).map((lesson) => (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-12 h-10 rounded-xl bg-blue-100 flex flex-col items-center justify-center text-[#23479E] flex-shrink-0">
                    <span className="text-xs font-bold leading-none">{fmtTime(lesson.starts_at)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {lesson.topic || lesson.group?.name || t(lang, 'lesson')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fmtShort(lesson.starts_at)} · {lesson.teacher?.profile?.full_name ?? '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Polecenia */}
        {!isB2b && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{t(lang, 'your_referral_code')}</h3>
              <Link href="/polecenia" className="text-xs text-[#23479E] font-medium hover:underline">{t(lang, 'details')}</Link>
            </div>
            <div className="bg-[#EAF3FF] rounded-xl p-4 mb-4">
              <p className="text-xs text-[#23479E] font-medium mb-2">{t(lang, 'code_to_share')}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-[#23479E] tracking-widest">
                  {student.referral_code}
                </span>
                <CopyButton
                  text={student.referral_code}
                  className="p-2 rounded-lg hover:bg-blue-100 transition-colors text-[#23479E]"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{t(lang, 'referral_blurb')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tone }: {
  icon: typeof Clock
  label: string
  value: string
  tone?: 'red' | 'green'
}) {
  const iconColors = tone === 'red' ? 'bg-red-50 text-red-500' : tone === 'green' ? 'bg-green-50 text-green-600' : 'bg-[#EAF3FF] text-[#23479E]'
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className={`w-10 h-10 rounded-xl ${iconColors} flex items-center justify-center mb-3`}>
        <Icon size={18} />
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-xl font-black text-gray-900">{value}</p>
    </div>
  )
}
