'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, X, CalendarOff, Trash2, Users, Settings2, Ban } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LanguageLevel, LessonType, Holiday } from '@/types'

const DAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz']
const START_MIN = 8 * 60   // 08:00
const END_MIN = 21 * 60    // 21:00
const SLOT = 30            // minut
const SLOT_PX = 28
const HOURS = Array.from({ length: (END_MIN - START_MIN) / 60 + 1 }, (_, i) => 8 + i)

type CalLesson = {
  id: string
  startsAt: string
  endsAt: string
  student: string
  studentId: string
  isGroup?: boolean
  groupId?: string
  teacherId: string
  teacherName: string
  color: string
  topic: string
  type: LessonType
  meetingUrl: string
}

type TeacherOpt = { id: string; name: string; color: string; location: string }
type StudentOpt = { id: string; name: string; level: LanguageLevel; teacherId: string }
type GroupOpt = { id: string; name: string; level: LanguageLevel; teacherId: string }

// Czy data wypada w przerwie świątecznej/wakacyjnej
function isInHoliday(d: Date, holidays: Holiday[]) {
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return holidays.some((h) => ymd >= h.start_date && ymd <= h.end_date)
}

function startOfWeek(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = (x.getDay() + 6) % 7 // poniedziałek = 0
  x.setDate(x.getDate() - day)
  return x
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function minutesSinceMidnight(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

type RawLessonRow = {
  id: string
  starts_at: string
  ends_at: string
  teacher_id: string
  student_id: string | null
  group_id: string | null
  topic: string | null
  type: LessonType
  cancelled_at: string | null
  meeting_url: string | null
  student: { profile: { full_name: string } | null } | null
  teacher: { profile: { full_name: string } | null } | null
  group: { name: string; color: string } | null
}

export function AdminCalendar({
  initialLessons,
  initialWeekStart,
  teacherOptions,
  studentOptions,
  groupOptions,
  holidays,
}: {
  initialLessons: CalLesson[]
  initialWeekStart: string
  teacherOptions: TeacherOpt[]
  studentOptions: StudentOpt[]
  groupOptions: GroupOpt[]
  holidays: Holiday[]
}) {
  const router = useRouter()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(initialWeekStart)))
  const [lessons, setLessons] = useState<CalLesson[]>(initialLessons)
  const [loading, setLoading] = useState(false)
  const [teacherFilter, setTeacherFilter] = useState('')
  const [adding, setAdding] = useState(false)
  const [managingHolidays, setManagingHolidays] = useState(false)
  const [managingLesson, setManagingLesson] = useState<CalLesson | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<{ lesson: CalLesson; newStart: Date; newEnd: Date } | null>(null)

  const teacherColorMap = useMemo(() => new Map(teacherOptions.map((t) => [t.id, t.color])), [teacherOptions])
  const isFirstRender = useRef(true)

  async function fetchWeek(start: Date) {
    setLoading(true)
    const supabase = createClient()
    const end = new Date(start.getTime() + 7 * 86400000)
    const { data } = await supabase
      .from('lessons')
      .select(`
        id, starts_at, ends_at, teacher_id, student_id, group_id, topic, type, cancelled_at, meeting_url,
        student:students(profile:profiles(full_name)),
        teacher:teachers(profile:profiles(full_name)),
        group:groups(name, color)
      `)
      .gte('starts_at', start.toISOString())
      .lt('starts_at', end.toISOString())
      .order('starts_at', { ascending: true })

    setLoading(false)
    const rows = (data as unknown as RawLessonRow[]) ?? []
    const mapped: CalLesson[] = rows
      .filter((l) => !l.cancelled_at)
      .map((l) => ({
        id: l.id,
        startsAt: l.starts_at,
        endsAt: l.ends_at,
        student: l.group ? l.group.name : (l.student?.profile?.full_name ?? '—'),
        studentId: l.student_id ?? '',
        isGroup: !!l.group_id,
        groupId: l.group_id ?? '',
        teacherId: l.teacher_id,
        teacherName: l.teacher?.profile?.full_name ?? '—',
        color: l.group ? l.group.color : (teacherColorMap.get(l.teacher_id) ?? '#23479E'),
        topic: l.topic ?? '',
        type: l.type,
        meetingUrl: l.meeting_url ?? '',
      }))
    setLessons(mapped)
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    fetchWeek(weekStart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  function refresh() {
    fetchWeek(weekStart)
    router.refresh()
  }

  function handleDrop(e: React.DragEvent, day: Date) {
    e.preventDefault()
    const id = dragId
    setDragId(null)
    if (!id) return
    const lesson = lessons.find((l) => l.id === id)
    if (!lesson) return

    const rect = e.currentTarget.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const slots = Math.round(offsetY / SLOT_PX)
    const minutes = Math.min(Math.max(START_MIN + slots * SLOT, START_MIN), END_MIN)

    const newStart = new Date(day)
    newStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
    const durationMs = new Date(lesson.endsAt).getTime() - new Date(lesson.startsAt).getTime()
    const newEnd = new Date(newStart.getTime() + durationMs)

    // bez zmiany? pomiń
    if (newStart.getTime() === new Date(lesson.startsAt).getTime()) return
    setPendingMove({ lesson, newStart, newEnd })
  }

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    }),
    [weekStart],
  )

  const visible = lessons.filter((l) => !teacherFilter || l.teacherId === teacherFilter)

  const weekLabel = `${days[0].toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}`

  function shiftWeek(delta: number) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    setWeekStart(d)
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-black text-gray-900">Kalendarz</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setManagingHolidays(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <CalendarOff size={16} /> Przerwy
          </button>
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus size={16} /> Dodaj lekcję
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1">
          <button onClick={() => shiftWeek(-1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronLeft size={16} /></button>
          <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Dziś</button>
          <button onClick={() => shiftWeek(1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronRight size={16} /></button>
        </div>
        <span className="text-sm font-semibold text-gray-700">{weekLabel}</span>
        {loading && <span className="text-xs text-gray-400">Ładowanie...</span>}
        <span className="hidden md:inline text-xs text-gray-400">· przeciągnij, aby przełożyć · kliknij, aby zarządzać</span>
        <select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}
          className="ml-auto px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
          <option value="">Wszyscy nauczyciele</option>
          {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <div className="min-w-max">
          {/* Nagłówek dni */}
          <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, minmax(120px, 1fr))' }}>
            <div className="border-b border-gray-100" />
            {days.map((d, i) => {
              const today = sameDay(d, new Date())
              const holiday = holidays.find((h) => isInHoliday(d, [h]))
              return (
                <div key={i} className={`border-b border-l border-gray-100 px-2 py-2 text-center ${holiday ? 'bg-amber-50' : ''}`}>
                  <p className="text-xs font-medium text-gray-400">{DAY_LABELS[i]}</p>
                  <p className={`text-sm font-bold ${today ? 'text-[#23479E]' : 'text-gray-900'}`}>{d.getDate()}</p>
                  {holiday && <p className="text-[9px] text-amber-600 font-semibold truncate" title={holiday.name}>{holiday.name}</p>}
                </div>
              )
            })}
          </div>

          {/* Siatka */}
          <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, minmax(120px, 1fr))' }}>
            {/* Godziny */}
            <div className="relative" style={{ height: ((END_MIN - START_MIN) / SLOT) * SLOT_PX }}>
              {HOURS.map((h, i) => (
                <div key={h} className="absolute right-2 text-xs text-gray-400 font-medium" style={{ top: i * 2 * SLOT_PX - 6 }}>{h}:00</div>
              ))}
            </div>

            {/* Kolumny dni */}
            {days.map((d, di) => {
              const dayLessons = visible.filter((l) => sameDay(new Date(l.startsAt), d))
              const holiday = isInHoliday(d, holidays)
              return (
                <div key={di} className={`relative border-l border-gray-50 ${holiday ? 'bg-amber-50/40' : ''}`}
                  style={{ height: ((END_MIN - START_MIN) / SLOT) * SLOT_PX }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, d)}>
                  {/* linie godzinowe */}
                  {HOURS.map((h, i) => (
                    <div key={h} className="absolute left-0 right-0 border-b border-gray-50" style={{ top: i * 2 * SLOT_PX }} />
                  ))}
                  {/* lekcje */}
                  {dayLessons.map((l) => {
                    const top = ((minutesSinceMidnight(l.startsAt) - START_MIN) / SLOT) * SLOT_PX
                    const dur = (new Date(l.endsAt).getTime() - new Date(l.startsAt).getTime()) / 60000
                    const height = Math.max((dur / SLOT) * SLOT_PX - 2, 18)
                    return (
                      <div key={l.id} draggable
                        onDragStart={() => setDragId(l.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setManagingLesson(l)}
                        className={`absolute left-1 right-1 rounded-md px-1.5 py-0.5 overflow-hidden text-white cursor-pointer active:cursor-grabbing ${dragId === l.id ? 'opacity-40' : ''}`}
                        style={{ top, height, backgroundColor: l.color }}
                        title={`${l.student} · ${l.teacherName} · ${l.topic} — kliknij, aby zarządzać, przeciągnij, aby przełożyć`}>
                        <p className="text-[11px] font-bold leading-tight truncate flex items-center gap-1">
                          {l.isGroup && <Users size={10} className="flex-shrink-0" />}{l.student}
                        </p>
                        <p className="text-[10px] leading-tight truncate opacity-80">{l.teacherName}</p>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {adding && (
        <AddLessonModal
          teacherOptions={teacherOptions}
          studentOptions={studentOptions}
          groupOptions={groupOptions}
          holidays={holidays}
          defaultDate={days[0]}
          onClose={() => setAdding(false)}
          onSaved={() => { setAdding(false); refresh() }}
        />
      )}

      {managingHolidays && (
        <HolidayManager
          holidays={holidays}
          onClose={() => setManagingHolidays(false)}
          onChanged={() => router.refresh()}
        />
      )}

      {pendingMove && (
        <ConfirmMoveModal
          move={pendingMove}
          onClose={() => setPendingMove(null)}
          onDone={() => { setPendingMove(null); refresh() }}
        />
      )}

      {managingLesson && (
        <ManageLessonModal
          lesson={managingLesson}
          teacherOptions={teacherOptions}
          onClose={() => setManagingLesson(null)}
          onDone={() => { setManagingLesson(null); refresh() }}
        />
      )}
    </div>
  )
}

function toLocalInput(iso: string) {
  const d = new Date(iso); const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

function ManageLessonModal({
  lesson,
  teacherOptions,
  onClose,
  onDone,
}: {
  lesson: CalLesson
  teacherOptions: TeacherOpt[]
  onClose: () => void
  onDone: () => void
}) {
  const durationMs = new Date(lesson.endsAt).getTime() - new Date(lesson.startsAt).getTime()
  const [start, setStart] = useState(toLocalInput(lesson.startsAt))
  const [duration, setDuration] = useState(Math.round(durationMs / 60000))
  const [teacherId, setTeacherId] = useState(lesson.teacherId)
  const [type, setType] = useState<LessonType>(lesson.type)
  const [topic, setTopic] = useState(lesson.topic)
  const [meetingUrl, setMeetingUrl] = useState(lesson.meetingUrl)
  const [mode, setMode] = useState<'edit' | 'cancel'>('edit')
  const [cancelReason, setCancelReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLate = mode === 'cancel' && Date.now() > new Date(lesson.startsAt).getTime() - 24 * 3600 * 1000

  async function teacherHasConflict(newStart: Date, newEnd: Date) {
    const supabase = createClient()
    const { data } = await supabase
      .from('lessons')
      .select('id')
      .eq('teacher_id', teacherId)
      .lt('starts_at', newEnd.toISOString())
      .gt('ends_at', newStart.toISOString())
    return (data ?? []).some((r) => r.id !== lesson.id)
  }

  async function saveChanges() {
    setSaving(true); setError(null)
    const newStart = new Date(start)
    const newEnd = new Date(newStart.getTime() + duration * 60000)
    const teacherChanged = teacherId !== lesson.teacherId
    const timeChanged = newStart.getTime() !== new Date(lesson.startsAt).getTime() || newEnd.getTime() !== new Date(lesson.endsAt).getTime()

    if (teacherChanged || timeChanged) {
      if (await teacherHasConflict(newStart, newEnd)) {
        setSaving(false); setError('Nauczyciel ma już lekcję w tym terminie.'); return
      }
    }

    const supabase = createClient()
    const { error } = await supabase.from('lessons').update({
      starts_at: newStart.toISOString(),
      ends_at: newEnd.toISOString(),
      teacher_id: teacherId,
      type,
      topic: topic || null,
      meeting_url: meetingUrl || null,
    }).eq('id', lesson.id)
    setSaving(false)
    if (error) { setError('Nie udało się zapisać: ' + error.message); return }
    onDone()
  }

  async function confirmCancel() {
    setSaving(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('lessons').update({
      cancelled_reason: cancelReason.trim() || null,
      cancelled_at: new Date().toISOString(),
    }).eq('id', lesson.id)
    setSaving(false)
    if (error) { setError('Nie udało się odwołać: ' + error.message); return }
    onDone()
  }

  async function hardDelete() {
    if (!confirm('Usunąć tę lekcję na stałe? Tej operacji nie można cofnąć.')) return
    setSaving(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('lessons').delete().eq('id', lesson.id)
    setSaving(false)
    if (error) { setError('Nie udało się usunąć: ' + error.message); return }
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><Settings2 size={18} />Zarządzaj lekcją</h2>
            <p className="text-xs text-gray-400">{lesson.student}{lesson.isGroup ? ' (grupa)' : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-4">
          <button type="button" onClick={() => setMode('edit')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'edit' ? 'bg-[#23479E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            Edytuj
          </button>
          <button type="button" onClick={() => setMode('cancel')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'cancel' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            Odwołaj
          </button>
        </div>

        {mode === 'edit' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Termin</label>
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Czas (min)</label>
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                  {[30, 45, 60, 90].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nauczyciel</label>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                  {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Typ</label>
              <select value={type} onChange={(e) => setType(e.target.value as LessonType)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                <option value="online">Online</option>
                <option value="offline">Stacjonarnie</option>
              </select>
            </div>
            {type === 'online' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Link do zajęć online (Zoom / Meet)</label>
                <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
                <p className="text-xs text-gray-400 mt-1">Widoczny dla ucznia na liście jego lekcji.</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Temat</label>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="np. Business English"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
              <button onClick={saveChanges} disabled={saving}
                className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60">
                {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </button>
            </div>
            <button onClick={hardDelete} disabled={saving}
              className="w-full mt-1 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-red-500 flex items-center justify-center gap-1.5">
              <Trash2 size={13} />Usuń lekcję na stałe
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{new Date(lesson.startsAt).toLocaleString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {lesson.teacherName}</p>
            {isLate && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                <Ban size={14} className="mt-0.5 shrink-0" />
                Odwołujesz lekcję w ciągu 24h — zostanie zarejestrowana jako odwołanie z krótkim wyprzedzeniem.
              </div>
            )}
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={2}
              placeholder="Powód odwołania (opcjonalnie)"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E] resize-none" />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Wróć</button>
              <button onClick={confirmCancel} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-60">
                {saving ? 'Odwoływanie...' : 'Potwierdź odwołanie'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfirmMoveModal({
  move,
  onClose,
  onDone,
}: {
  move: { lesson: CalLesson; newStart: Date; newEnd: Date }
  onClose: () => void
  onDone: () => void
}) {
  const { lesson, newStart, newEnd } = move
  const [saving, setSaving] = useState<'one' | 'series' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const oldLabel = new Date(lesson.startsAt).toLocaleString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const newLabel = newStart.toLocaleString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  async function teacherHasConflict(excludeIds: string[], start: Date, end: Date) {
    const supabase = createClient()
    const { data } = await supabase
      .from('lessons')
      .select('id')
      .eq('teacher_id', lesson.teacherId)
      .lt('starts_at', end.toISOString())
      .gt('ends_at', start.toISOString())
    return (data ?? []).some((r) => !excludeIds.includes(r.id))
  }

  async function apply(scope: 'one' | 'series') {
    setSaving(scope)
    setError(null)
    const supabase = createClient()

    if (scope === 'one') {
      if (await teacherHasConflict([lesson.id], newStart, newEnd)) {
        setSaving(null); setError('Kolizja: nauczyciel ma już lekcję w tym terminie.'); return
      }
      const { error } = await supabase
        .from('lessons')
        .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() })
        .eq('id', lesson.id)
      setSaving(null)
      if (error) { setError('Nie udało się zapisać: ' + error.message); return }
      onDone()
      return
    }

    // series: ta i przyszłe lekcje tego samego studenta+nauczyciela w ten sam dzień tygodnia i godzinę
    const deltaMs = newStart.getTime() - new Date(lesson.startsAt).getTime()
    const base = new Date(lesson.startsAt)
    const baseDow = base.getDay()
    const baseHM = base.getHours() * 60 + base.getMinutes()

    const { data: candidates } = await supabase
      .from('lessons')
      .select('id, starts_at, ends_at')
      .eq('student_id', (await supabase.from('lessons').select('student_id').eq('id', lesson.id).single()).data?.student_id)
      .eq('teacher_id', lesson.teacherId)
      .gte('starts_at', lesson.startsAt)

    const series = (candidates ?? []).filter((l) => {
      const d = new Date(l.starts_at)
      return d.getDay() === baseDow && d.getHours() * 60 + d.getMinutes() === baseHM
    })
    const seriesIds = series.map((s) => s.id)

    for (const l of series) {
      const s = new Date(new Date(l.starts_at).getTime() + deltaMs)
      const e = new Date(new Date(l.ends_at).getTime() + deltaMs)
      if (await teacherHasConflict(seriesIds, s, e)) {
        setSaving(null); setError('Kolizja w serii — jeden z nowych terminów jest zajęty.'); return
      }
    }

    for (const l of series) {
      const s = new Date(new Date(l.starts_at).getTime() + deltaMs).toISOString()
      const e = new Date(new Date(l.ends_at).getTime() + deltaMs).toISOString()
      await supabase.from('lessons').update({ starts_at: s, ends_at: e }).eq('id', l.id)
    }
    setSaving(null)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900">Przełożyć lekcję?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <p className="text-sm text-gray-600 mb-1">{lesson.student} · {lesson.teacherName}</p>
        <p className="text-sm text-gray-500 mb-5">
          <span className="line-through">{oldLabel}</span> → <span className="font-semibold text-gray-900">{newLabel}</span>
        </p>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="space-y-2">
          <button onClick={() => apply('one')} disabled={saving !== null}
            className="w-full px-4 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 text-left">
            {saving === 'one' ? 'Przekładanie...' : 'Tylko ta lekcja'}
            <span className="block text-xs font-normal opacity-80">Zmienia wyłącznie ten jeden termin.</span>
          </button>
          <button onClick={() => apply('series')} disabled={saving !== null}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60 text-left">
            {saving === 'series' ? 'Przekładanie serii...' : 'Ta i wszystkie przyszłe (na stałe)'}
            <span className="block text-xs font-normal text-gray-500">Przesuwa wszystkie kolejne lekcje tego ucznia w ten sam dzień i godzinę.</span>
          </button>
          <button onClick={onClose} disabled={saving !== null}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">
            Anuluj
          </button>
        </div>
      </div>
    </div>
  )
}

function HolidayManager({ holidays, onClose, onChanged }: { holidays: Holiday[]; onClose: () => void; onChanged: () => void }) {
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function add() {
    if (!name.trim() || !from || !to) { setError('Podaj nazwę i zakres dat.'); return }
    if (to < from) { setError('Data końca nie może być wcześniejsza niż początek.'); return }
    setBusy(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('holidays').insert({ name: name.trim(), start_date: from, end_date: to })
    setBusy(false)
    if (error) { setError('Nie udało się dodać: ' + error.message); return }
    setName(''); setFrom(''); setTo('')
    onChanged()
  }

  async function remove(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('holidays').delete().eq('id', id)
    if (!error) onChanged()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><CalendarOff size={18} />Przerwy świąteczne / wakacyjne</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-2 mb-5 max-h-52 overflow-y-auto">
          {holidays.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">Brak zdefiniowanych przerw.</p>
          ) : holidays.map((h) => (
            <div key={h.id} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{h.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(h.start_date).toLocaleDateString('pl-PL')} – {new Date(h.end_date).toLocaleDateString('pl-PL')}
                </p>
              </div>
              <button onClick={() => remove(h.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa (np. Ferie zimowe)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Od</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Do</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button onClick={add} disabled={busy}
            className="w-full py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
            <Plus size={16} />{busy ? 'Dodawanie...' : 'Dodaj przerwę'}
          </button>
        </div>
      </div>
    </div>
  )
}

const LEVELS: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function AddLessonModal({
  teacherOptions,
  studentOptions,
  groupOptions,
  holidays,
  defaultDate,
  onClose,
  onSaved,
}: {
  teacherOptions: TeacherOpt[]
  studentOptions: StudentOpt[]
  groupOptions: GroupOpt[]
  holidays: Holiday[]
  defaultDate: Date
  onClose: () => void
  onSaved: () => void
}) {
  const [mode, setMode] = useState<'individual' | 'group'>('individual')
  const [studentId, setStudentId] = useState(studentOptions[0]?.id ?? '')
  const [groupId, setGroupId] = useState(groupOptions[0]?.id ?? '')
  const selectedStudent = studentOptions.find((s) => s.id === studentId)
  const [teacherId, setTeacherId] = useState(selectedStudent?.teacherId || teacherOptions[0]?.id || '')
  const [level, setLevel] = useState<LanguageLevel>(selectedStudent?.level ?? 'A1')
  const [date, setDate] = useState(defaultDate.toISOString().slice(0, 10))
  const [time, setTime] = useState('17:00')
  const [duration, setDuration] = useState(60)
  const [type, setType] = useState<LessonType>('online')
  const [topic, setTopic] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [weeks, setWeeks] = useState(8)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  function onStudentChange(id: string) {
    setStudentId(id)
    const s = studentOptions.find((x) => x.id === id)
    if (s) {
      if (s.teacherId) setTeacherId(s.teacherId)
      setLevel(s.level)
    }
  }

  function onGroupChange(id: string) {
    setGroupId(id)
    const g = groupOptions.find((x) => x.id === id)
    if (g) {
      if (g.teacherId) setTeacherId(g.teacherId)
      setLevel(g.level)
    }
  }

  async function hasConflict(supabase: ReturnType<typeof createClient>, start: Date, end: Date) {
    const { data: teacherConflict } = await supabase
      .from('lessons').select('id')
      .eq('teacher_id', teacherId)
      .lt('starts_at', end.toISOString())
      .gt('ends_at', start.toISOString())
    if (teacherConflict && teacherConflict.length > 0) return 'nauczyciel'

    const teacher = teacherOptions.find((t) => t.id === teacherId)
    if (type === 'offline' && teacher?.location) {
      const sameLocTeacherIds = teacherOptions.filter((t) => t.location === teacher.location).map((t) => t.id)
      const { data: roomConflict } = await supabase
        .from('lessons').select('id')
        .in('teacher_id', sameLocTeacherIds).eq('type', 'offline')
        .lt('starts_at', end.toISOString())
        .gt('ends_at', start.toISOString())
      if (roomConflict && roomConflict.length > 0) return 'sala'
    }
    return null
  }

  async function handleSave() {
    setError(null); setInfo(null)
    if (mode === 'individual' && !studentId) { setError('Wybierz studenta.'); return }
    if (mode === 'group' && !groupId) { setError('Wybierz grupę.'); return }
    if (!teacherId) { setError('Wybierz nauczyciela.'); return }
    setSaving(true)
    const supabase = createClient()

    const occurrences = recurring ? Math.max(1, Math.min(weeks, 52)) : 1
    const base = new Date(`${date}T${time}`)

    const rows: { starts_at: string; ends_at: string }[] = []
    const skipped: string[] = []
    const holidaySkipped: string[] = []

    for (let i = 0; i < occurrences; i++) {
      const start = new Date(base.getTime() + i * 7 * 86400000)
      const end = new Date(start.getTime() + duration * 60000)
      if (isInHoliday(start, holidays)) {
        holidaySkipped.push(start.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }))
        continue
      }
      const conflict = await hasConflict(supabase, start, end)
      if (conflict) {
        skipped.push(`${start.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })} (${conflict})`)
        continue
      }
      rows.push({ starts_at: start.toISOString(), ends_at: end.toISOString() })
    }

    if (rows.length === 0) {
      setSaving(false)
      setError(recurring ? 'Wszystkie terminy serii kolidują lub wypadają w przerwie.' : (isInHoliday(base, holidays) ? 'Ten termin wypada w przerwie.' : 'Kolizja: nauczyciel/sala zajęte w tym czasie.'))
      return
    }

    const { error } = await supabase.from('lessons').insert(
      rows.map((r) => ({
        student_id: mode === 'individual' ? studentId : null,
        group_id: mode === 'group' ? groupId : null,
        teacher_id: teacherId, type, format: mode === 'group' ? 'group' : 'individual', level,
        topic: topic || null, starts_at: r.starts_at, ends_at: r.ends_at,
        meeting_url: type === 'online' ? (meetingUrl || null) : null,
      }))
    )
    setSaving(false)
    if (error) { setError('Nie udało się dodać: ' + error.message); return }

    const notes: string[] = []
    if (skipped.length > 0) notes.push(`pominięto kolidujące: ${skipped.join(', ')}`)
    if (holidaySkipped.length > 0) notes.push(`pominięto przerwy: ${holidaySkipped.join(', ')}`)
    if (notes.length > 0) {
      setInfo(`Dodano ${rows.length} lekcji. ${notes.join('; ')}.`)
      setTimeout(onSaved, 2800)
      return
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Dodaj lekcję</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button type="button" onClick={() => setMode('individual')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'individual' ? 'bg-[#23479E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Indywidualna
            </button>
            <button type="button" onClick={() => setMode('group')} disabled={groupOptions.length === 0}
              className={`flex-1 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${mode === 'group' ? 'bg-[#23479E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              Grupowa
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{mode === 'group' ? 'Grupa' : 'Student'}</label>
              {mode === 'group' ? (
                <select value={groupId} onChange={(e) => onGroupChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                  {groupOptions.length === 0 && <option value="">Brak grup</option>}
                  {groupOptions.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              ) : (
                <select value={studentId} onChange={(e) => onStudentChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                  {studentOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nauczyciel</label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Godzina</label>
              <input type="time" step={1800} value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Czas (min)</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                {[30, 45, 60, 90].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Poziom</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as LanguageLevel)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Typ</label>
              <select value={type} onChange={(e) => setType(e.target.value as LessonType)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                <option value="online">Online</option>
                <option value="offline">Stacjonarnie</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Temat</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="np. Business English"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>
          {type === 'online' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Link do zajęć online (Zoom / Meet, opcjonalnie)</label>
              <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://zoom.us/j/..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          )}

          <div className="rounded-xl border border-gray-200 p-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#23479E]" />
              <span className="text-sm font-medium text-gray-700">Lekcja cykliczna (co tydzień)</span>
            </label>
            {recurring && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-600">Liczba tygodni:</span>
                <input type="number" min={1} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
                <span className="text-xs text-gray-400">kolidujące terminy zostaną pominięte</span>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        {info && <p className="text-sm text-green-600 mt-3">{info}</p>}

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? 'Zapisywanie...' : 'Dodaj lekcję'}
          </button>
        </div>
      </div>
    </div>
  )
}
