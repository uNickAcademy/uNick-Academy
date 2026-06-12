import { Calendar, Video, MapPin, Clock, User, BookOpen, GraduationCap, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getStudentByProfileId, getStudentLessons } from '@/lib/supabase/queries'
import type { Lesson, AttendanceStatus } from '@/types'
import { MakeupActions } from './MakeupActions'
import { getLang } from '@/lib/lang'
import { t, type Lang } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

const ATT: Record<AttendanceStatus, { key: 'att_present' | 'att_absent' | 'att_excused'; className: string; icon: typeof CheckCircle } | null> = {
  scheduled: null,
  present: { key: 'att_present', className: 'text-green-600', icon: CheckCircle },
  absent: { key: 'att_absent', className: 'text-red-500', icon: XCircle },
  excused: { key: 'att_excused', className: 'text-amber-600', icon: CheckCircle },
}

export default async function LekcjePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const student = await getStudentByProfileId(user.id)
  if (!student) return null

  const lang = await getLang()
  const lessons = await getStudentLessons(student.id)
  const now = Date.now()
  const upcoming = lessons.filter((l) => new Date(l.starts_at).getTime() >= now)
  const past = lessons.filter((l) => new Date(l.starts_at).getTime() < now)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">{t(lang, 'my_lessons')}</h1>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t(lang, 'upcoming')} ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">{t(lang, 'no_upcoming')}</p>
        ) : (
          <div className="space-y-3">{upcoming.map((l) => <LessonCard key={l.id} lesson={l} upcoming lang={lang} />)}</div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t(lang, 'completed')} ({past.length})</h2>
        {past.length === 0 ? (
          <p className="text-sm text-gray-400">{t(lang, 'no_completed')}</p>
        ) : (
          <div className="space-y-3">{past.map((l) => <LessonCard key={l.id} lesson={l} upcoming={false} lang={lang} />)}</div>
        )}
      </section>
    </div>
  )
}

function LessonCard({ lesson, upcoming, lang }: { lesson: Lesson; upcoming: boolean; lang: Lang }) {
  const locale = lang === 'en' ? 'en-GB' : 'pl-PL'
  const date = new Date(lesson.starts_at).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const time = new Date(lesson.starts_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const teacher = lesson.teacher?.profile?.full_name ?? '—'
  const att = lesson.attendance ? ATT[lesson.attendance] : null
  const materials = lesson.materials ?? []

  return (
    <div className={`bg-white rounded-2xl p-4 border ${upcoming ? 'border-blue-100 shadow-sm' : 'border-gray-100'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${upcoming ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <Calendar size={20} className={upcoming ? 'text-[#23479E]' : 'text-gray-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-gray-900 text-sm">{lesson.topic || (lesson.group ? lesson.group.name : t(lang, 'lesson'))}</span>
            <span className="text-xs bg-[#EAF3FF] text-[#23479E] px-1.5 py-0.5 rounded font-semibold">{lesson.level}</span>
            {lesson.group && <span className="text-xs bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded font-semibold">{t(lang, 'group')}: {lesson.group.name}</span>}
            {att && (
              <span className={`flex items-center gap-1 text-xs font-semibold ${att.className}`}>
                <att.icon size={12} />{t(lang, att.key)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock size={11} />{date} · {time}</span>
            <span className="flex items-center gap-1"><User size={11} />{teacher}</span>
            <span className="flex items-center gap-1">
              {lesson.type === 'online' ? <Video size={11} /> : <MapPin size={11} />}
              {lesson.type === 'online' ? t(lang, 'online') : t(lang, 'offline')}
            </span>
          </div>
        </div>
        {upcoming && lesson.type === 'online' && lesson.meeting_url && (
          <a href={lesson.meeting_url} target="_blank" rel="noreferrer"
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#23479E] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1">
            <Video size={12} />{t(lang, 'join')}
          </a>
        )}
      </div>

      {upcoming && lesson.student_id && lesson.attendance !== 'excused' && (
        <MakeupActions
          lessonId={lesson.id}
          studentId={lesson.student_id}
          teacherId={lesson.teacher_id}
          level={lesson.level}
          originalDate={date}
          lang={lang}
        />
      )}
      {upcoming && lesson.attendance === 'excused' && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5"><XCircle size={13} />{t(lang, 'absence_reported')}</p>
        </div>
      )}

      {(lesson.homework || materials.length > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
          {lesson.homework && (
            <div className="flex items-start gap-2">
              <GraduationCap size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600"><span className="font-semibold">{t(lang, 'homework')}:</span> {lesson.homework}</p>
            </div>
          )}
          {materials.length > 0 && (
            <div className="flex items-start gap-2">
              <BookOpen size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {materials.map((m) => (
                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer"
                    className="text-xs bg-gray-50 hover:bg-[#EAF3FF] text-[#23479E] px-2 py-1 rounded-lg font-medium transition-colors">
                    {m.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
