import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, Clock, User, CreditCard, BookOpen, Tag, UsersRound, Monitor, MapPin } from 'lucide-react'
import { getStudentById, getStudentLessons, getStudentTransactions, getStudentGroups, getAllTeachersAdmin } from '@/lib/supabase/queries'
import { warsawDayOfWeek, warsawTimeOfDay } from '@/lib/lessons/schedule'
import { ScheduleEditor } from './ScheduleEditor'
import { LessonHistory } from './LessonHistory'

export const dynamic = 'force-dynamic'

export default async function Client360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const student = await getStudentById(id)
  if (!student) notFound()

  const [lessons, transactions, groups, teachers] = await Promise.all([
    getStudentLessons(student.id),
    getStudentTransactions(student.id),
    getStudentGroups(student.id),
    getAllTeachersAdmin(),
  ])

  const now = Date.now()
  const past = lessons.filter((l) => new Date(l.starts_at).getTime() < now).sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
  const upcoming = lessons.filter((l) => new Date(l.starts_at).getTime() >= now)
  const present = past.filter((l) => l.attendance === 'present' || l.attendance === 'scheduled').length
  // Nieobecności sensu stricto; no_show i late_cancellation to lekcje odbyte i
  // płatne (przepadły z winy ucznia) — pokazywane osobno, nie jako "nieobecność".
  const absent = past.filter((l) => l.attendance === 'absent').length
  const forfeited = past.filter((l) => l.attendance === 'no_show' || l.attendance === 'late_cancellation').length
  // Godziny = tylko lekcje odbyte/płatne (bez excused "do odrobienia" i absent)
  const totalHours = past
    .filter((l) => ['present', 'scheduled', 'no_show', 'late_cancellation'].includes(l.attendance ?? 'scheduled'))
    .reduce((acc, l) => acc + (new Date(l.ends_at).getTime() - new Date(l.starts_at).getTime()) / 3_600_000, 0)
  const customFields = student.custom_fields ?? {}

  // Uczniowie sprzed przebudowy kreatora nie mają course_config — podpowiedź
  // terminu w edytorze harmonogramu bierzemy wtedy z najbliższej co do „teraz"
  // lekcji, żeby edytor nie startował z pustego miejsca.
  const nearLesson = upcoming[0] ?? past[0] ?? null
  const inferredSlot = !student.course_config && nearLesson
    ? {
        day: warsawDayOfWeek(nearLesson.starts_at),
        time: warsawTimeOfDay(nearLesson.starts_at),
        durationMin: Math.max(1, Math.round((new Date(nearLesson.ends_at).getTime() - new Date(nearLesson.starts_at).getTime()) / 60000)),
      }
    : null
  const teacherOptions = teachers.filter((t) => t.is_active).map((t) => ({
    id: t.id,
    name: t.profile?.full_name ?? '—',
    onlineIndividualPayRate: t.online_individual_pay_rate ?? null,
    onlineIndividualClientRate: t.online_individual_client_rate ?? null,
  }))
  const scheduleStudent = {
    id: student.id,
    name: student.full_name ?? student.profile?.full_name ?? '—',
    teacherId: student.teacher_id ?? '',
    courseConfig: student.course_config ?? null,
    inferredSlot,
    meetingUrl: student.course_config?.meetingUrl ?? nearLesson?.meeting_url ?? '',
    lessonPrice: student.custom_lesson_price ?? null,
    teacherRate: student.custom_teacher_rate ?? null,
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/admin/studenci" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#23479E] mb-4">
        <ArrowLeft size={15} />Wróć do listy
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{student.full_name ?? student.profile?.full_name}</h1>
            <p className="text-sm text-gray-500 mt-1">{student.profile?.email}{student.profile?.phone ? ` · ${student.profile.phone}` : ''}</p>
            {student.guardian_name && <p className="text-xs text-gray-400 mt-0.5">Rodzic/opiekun: {student.guardian_name}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#EAF3FF] text-[#23479E]">{student.level}</span>
              {student.age_group && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{student.age_group}</span>}
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{student.status}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-violet-50 text-violet-600">{student.teacher?.profile?.full_name ?? 'bez lektora'}</span>
              <span className="text-xs text-gray-400 font-mono">{student.referral_code}</span>
            </div>
            <div className="mt-3">
              <ScheduleEditor student={scheduleStudent} teacherOptions={teacherOptions} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Saldo</p>
            <p className={`text-2xl font-black ${student.credit_balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
              {student.credit_balance.toLocaleString('pl-PL')} zł
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Stat icon={CheckCircle} label="Obecności" value={String(present)} color="text-green-600" />
        <Stat icon={XCircle} label="Nieobecności" value={String(absent)} color="text-red-500" />
        <Stat icon={XCircle} label="Przepadłe (płatne)" value={String(forfeited)} color="text-orange-500" />
        <Stat icon={Clock} label="Godziny (płatne)" value={`${Math.round(totalHours * 10) / 10}h`} color="text-[#23479E]" />
        <Stat icon={BookOpen} label="Lekcje łącznie" value={String(lessons.length)} color="text-gray-900" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><UsersRound size={16} />Kursy / grupy</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-gray-400">Uczeń nie jest zapisany do żadnej grupy.</p>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-gray-100 px-4 py-3">
                <span className="font-semibold text-gray-900">{g.name}</span>
                {!g.isActive && <span className="text-[11px] font-bold uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Kurs zakończony</span>}
                {g.format && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    {g.format === 'online' ? <Monitor size={12} /> : <MapPin size={12} />}
                    {g.format === 'online' ? 'Online' : 'Stacjonarnie'}
                  </span>
                )}
                {g.scheduleText && <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12} />{g.scheduleText}</span>}
                <span className="text-xs text-gray-500">{g.teacherName}</span>
                {g.pricePerMonth != null && <span className="ml-auto text-sm font-bold text-[#23479E]">{g.pricePerMonth} zł / mies.</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {Object.keys(customFields).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Tag size={16} />Własne pola</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(customFields).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-sm"><span className="text-gray-400">{k}:</span><span className="text-gray-800 font-medium">{String(v)}</span></div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><BookOpen size={16} />Historia lekcji</h2>
          <LessonHistory lessons={past} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><CreditCard size={16} />Historia płatności</h2>
          {transactions.length === 0 ? <p className="text-sm text-gray-400">Brak transakcji.</p> : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0">{new Date(tx.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', timeZone: 'Europe/Warsaw' })}</span>
                  <span className="flex-1 truncate text-gray-700">{tx.description}</span>
                  <span className={`font-bold ${tx.type === 'charge' ? 'text-red-500' : 'text-gray-900'}`}>
                    {tx.type === 'charge' ? '−' : '+'}{Number(tx.amount).toLocaleString('pl-PL')} zł
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: typeof User; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-2 text-gray-400"><Icon size={16} /></div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  )
}
