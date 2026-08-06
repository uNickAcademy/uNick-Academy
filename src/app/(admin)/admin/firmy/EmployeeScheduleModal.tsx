'use client'

import { useState } from 'react'
import {
  X, Repeat, Plus, Trash2, CalendarRange, CalendarOff, Link2, Banknote, Wallet, RefreshCw, Monitor, MapPin,
} from 'lucide-react'
import { generateLessons, lessonsPerMonth, defaultCourseEndDate, DAYS_PL_SHORT, type Slot } from '@/lib/lessons/schedule'

export type EmployeeRow = {
  id: string
  name: string
  teacherId: string
  courseConfig: { slots: Slot[]; startDate: string; endDate: string | null; excludedDates?: string[]; meetingUrl?: string } | null
  inferredSlot: Slot | null
  meetingUrl: string
  lessonPrice: number | null
  teacherRate: number | null
}

export type TeacherOpt = {
  id: string
  name: string
  onlineIndividualPayRate: number | null
  onlineIndividualClientRate: number | null
}

const zl = (n: number) => `${Math.round(n).toLocaleString('pl-PL')} zł`

// Ten sam mechanizm co edycja harmonogramu w panelu Studenci (/api/admin/students/schedule)
// — nienaruszający zapis linku/stawki/prowadzącego na już zaplanowanych lekcjach, plus
// osobna, świadoma regeneracja przyszłej serii terminów. Różnica: pracownik B2B może mieć
// zajęcia stacjonarne w siedzibie firmy, stąd przełącznik online/stacjonarnie.
export function EmployeeScheduleModal({ employee, teacherOptions, onClose, onSaved }: {
  employee: EmployeeRow
  teacherOptions: TeacherOpt[]
  onClose: () => void
  onSaved: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [teacherId, setTeacherId] = useState(employee.teacherId)
  const initialTeacher = teacherOptions.find((t) => t.id === employee.teacherId)
  const selectedTeacher = teacherOptions.find((t) => t.id === teacherId) ?? initialTeacher

  const initialSlots = employee.courseConfig?.slots?.length ? employee.courseConfig.slots : (employee.inferredSlot ? [employee.inferredSlot] : [])
  const [slots, setSlots] = useState<Slot[]>(initialSlots.length > 0 ? initialSlots : [{ day: 1, time: '17:00', durationMin: 60 }])
  const [startDate, setStartDate] = useState(employee.courseConfig?.startDate ?? today)
  const [endDate, setEndDate] = useState(employee.courseConfig?.endDate ?? defaultCourseEndDate(today))
  const [ongoing, setOngoing] = useState(employee.courseConfig != null && employee.courseConfig.endDate == null)
  const effectiveEndDate = ongoing ? undefined : endDate
  const [excludedDates, setExcludedDates] = useState<string[]>(employee.courseConfig?.excludedDates ?? [])
  const [newExcluded, setNewExcluded] = useState('')
  const [meetingUrl, setMeetingUrl] = useState(employee.meetingUrl)
  const [lessonType, setLessonType] = useState<'online' | 'offline'>('online')
  const [lessonPrice, setLessonPrice] = useState(employee.lessonPrice != null ? String(employee.lessonPrice) : '')
  const [teacherRate, setTeacherRate] = useState(employee.teacherRate != null ? String(employee.teacherRate) : '')
  const [pricesTouched, setPricesTouched] = useState(false)

  const [scheduleBusy, setScheduleBusy] = useState(false)
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preview = generateLessons({ slots, startDate: startDate > today ? startDate : today, endDate: effectiveEndDate, excludedDates })
  const effectiveHorizon = ongoing ? defaultCourseEndDate(startDate > today ? startDate : today) : endDate
  const price = Number(lessonPrice) || 0
  const monthsPreview = Object.entries(lessonsPerMonth(preview)).sort()

  function selectTeacher(id: string) {
    setTeacherId(id)
    if (pricesTouched) return
    const t = teacherOptions.find((opt) => opt.id === id)
    setLessonPrice(t?.onlineIndividualClientRate != null ? String(t.onlineIndividualClientRate) : '')
    setTeacherRate(t?.onlineIndividualPayRate != null ? String(t.onlineIndividualPayRate) : '')
  }

  function setSlot(i: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }
  function addSlot() {
    const last = slots[slots.length - 1]
    setSlots((prev) => [...prev, { day: (last?.day ?? 0) + 2 > 6 ? 0 : (last?.day ?? 0) + 2, time: last?.time ?? '17:00', durationMin: last?.durationMin ?? 60 }])
  }
  function removeSlot(i: number) {
    setSlots((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))
  }
  function addExcluded() {
    const d = newExcluded.slice(0, 10)
    if (!d || excludedDates.includes(d)) return
    setExcludedDates((prev) => [...prev, d].sort())
    setNewExcluded('')
  }

  function payload(applySchedule: boolean) {
    return {
      studentId: employee.id, teacherId, meetingUrl, slots, startDate,
      endDate: ongoing ? null : endDate, excludedDates, lessonPrice, teacherRate, lessonType, applySchedule,
    }
  }

  // Nienaruszający zapis: aktualizuje link/stawkę/prowadzącego na już zaplanowanych,
  // przyszłych lekcjach i zapamiętuje konfigurację — nic nie usuwa.
  async function handleSave() {
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/students/schedule', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(false)),
    })
    setSaving(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Nie udało się zapisać.'); return }
    onSaved()
  }

  // Zastąpienie serii terminów — jedyna operacja, która cokolwiek kasuje, i tylko to,
  // co jeszcze się nie odbyło. Osobny przycisk i potwierdzenie.
  async function applySchedule() {
    if (preview.length === 0) { setScheduleMsg('Ta konfiguracja nie daje żadnej lekcji — sprawdź terminy i czas trwania.'); return }
    if (!teacherId) { setScheduleMsg('Przypisz nauczyciela przed wygenerowaniem terminów.'); return }
    const from = startDate > today ? startDate : today
    if (!confirm(
      `Zastąpić przyszłe terminy ${employee.name}?\n\n` +
      `${preview.length} zajęć od ${from} ${ongoing ? `(bezterminowo, wygenerowane do ${effectiveHorizon})` : `do ${endDate}`}` +
      (price > 0 ? `\nWartość ${ongoing ? 'na razie' : ''}: ${Math.round(price * preview.length)} zł` : '') +
      `\n\nOdbyte i historyczne lekcje zostają bez zmian — kasujemy tylko to, co jeszcze przed nami.`
    )) return
    setScheduleBusy(true); setScheduleMsg(null); setError(null)
    const res = await fetch('/api/admin/students/schedule', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(true)),
    })
    const data = await res.json().catch(() => ({}))
    setScheduleBusy(false)
    if (!res.ok) { setScheduleMsg('Błąd: ' + (data.error ?? 'nie udało się')); return }
    setScheduleMsg(`Zapisano ${data.regenerated} terminów.`)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">{employee.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nauczyciel</label>
            <select value={teacherId} onChange={(e) => selectTeacher(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]">
              <option value="">— brak —</option>
              {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <ModalSection title="Forma zajęć" icon={lessonType === 'online' ? Monitor : MapPin}>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(['online', 'offline'] as const).map((v) => (
                <button key={v} type="button" onClick={() => setLessonType(v)}
                  className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${lessonType === v ? 'bg-[#23479E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {v === 'online' ? 'Online' : 'Stacjonarnie (u klienta)'}
                </button>
              ))}
            </div>
          </ModalSection>

          <ModalSection title="Termin zajęć" icon={Repeat}
            action={<button type="button" onClick={addSlot} className="flex items-center gap-1 text-xs font-semibold text-[#23479E] hover:underline">
              <Plus size={13} />Dodaj termin</button>}>
            <div className="space-y-2">
              {slots.map((s, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <label className="text-xs text-gray-500">
                    Dzień
                    <select value={s.day} onChange={(e) => setSlot(i, { day: Number(e.target.value) })}
                      className="mt-1 block px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:border-[#23479E]">
                      {DAYS_PL_SHORT.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                    </select>
                  </label>
                  <label className="text-xs text-gray-500">
                    Godzina
                    <input type="time" value={s.time} onChange={(e) => setSlot(i, { time: e.target.value })}
                      className="mt-1 block px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
                  </label>
                  <label className="text-xs text-gray-500">
                    Długość (min)
                    <input type="number" min={15} step={5} value={s.durationMin}
                      onChange={(e) => setSlot(i, { durationMin: Number(e.target.value) })}
                      className="mt-1 block w-24 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
                  </label>
                  {slots.length > 1 && (
                    <button type="button" onClick={() => removeSlot(i)} title="Usuń termin"
                      className="p-2 mb-0.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                  )}
                </div>
              ))}
            </div>
          </ModalSection>

          <ModalSection title="Harmonogram zajęć" icon={CalendarRange}>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-gray-500">
                Regeneruj od
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
              </label>
              <div>
                <label className="text-xs text-gray-500">
                  Koniec kursu
                  <input type="date" value={endDate} min={startDate} disabled={ongoing}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E] disabled:bg-gray-50 disabled:text-gray-400" />
                </label>
                <label className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-600">
                  <input type="checkbox" checked={ongoing} onChange={(e) => setOngoing(e.target.checked)}
                    className="rounded border-gray-300" />
                  Bezterminowo (ongoing)
                </label>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><CalendarOff size={11} />Wyłączone dni</p>
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={newExcluded} min={startDate} max={effectiveHorizon}
                  onChange={(e) => setNewExcluded(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
                <button type="button" onClick={addExcluded} disabled={!newExcluded}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Dodaj
                </button>
                {excludedDates.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-700">
                    {d}
                    <button type="button" onClick={() => setExcludedDates((prev) => prev.filter((x) => x !== d))}
                      className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Ferie i przerwy z kalendarza szkoły są pomijane automatycznie.</p>
            </div>
            <div className="mt-3 rounded-xl bg-[#F5F8FF] border border-[#dbe6ff] px-3 py-2.5 text-xs">
              {preview.length === 0 ? (
                <p className="text-red-500">Ta konfiguracja nie daje żadnej lekcji — sprawdź terminy i czas trwania.</p>
              ) : (
                <p className="text-gray-700">
                  <strong className="text-gray-900">{preview.length}</strong> zajęć od {startDate > today ? startDate : today}{' '}
                  {ongoing ? <>(bezterminowo, wygenerowane do {effectiveHorizon})</> : <>do {endDate}</>}
                  {price > 0 && (
                    <> · wartość {ongoing ? 'na razie' : ''} <strong className="text-[#23479E]">{zl(price * preview.length)}</strong></>
                  )}
                  {monthsPreview.length > 0 && ` · ${monthsPreview[0][1]} zajęć w najbliższym miesiącu`}
                </p>
              )}
            </div>
            <button type="button" onClick={applySchedule} disabled={scheduleBusy}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw size={14} />{scheduleBusy ? 'Zapisywanie...' : 'Zastosuj terminy (zastąpi przyszłe, jeszcze nieodbyte lekcje)'}
            </button>
            {scheduleMsg && <p className="text-xs text-gray-500 mt-2">{scheduleMsg}</p>}
          </ModalSection>

          <ModalSection title="Link do zajęć" icon={Link2}>
            <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet.jit.si/..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
          </ModalSection>

          <ModalSection title="Stawka nauczyciela" icon={Banknote}>
            <label className="text-xs text-gray-500">
              Za lekcję (zł)
              <input type="number" min={0} value={teacherRate}
                onChange={(e) => { setTeacherRate(e.target.value); setPricesTouched(true) }} placeholder="np. 35"
                className="mt-1 block w-40 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
            </label>
            <p className="text-xs text-gray-400 mt-1.5">
              {selectedTeacher?.onlineIndividualPayRate != null
                ? 'Podpowiedź z cennika nauczyciela — zmień, jeśli tego pracownika rozliczacie inaczej.'
                : 'Puste = stawka z kartoteki nauczyciela.'}
            </p>
          </ModalSection>

          <ModalSection title="Cena za zajęcia" icon={Wallet}>
            <label className="text-xs text-gray-500">
              Za lekcję (zł)
              <input type="number" min={0} value={lessonPrice}
                onChange={(e) => { setLessonPrice(e.target.value); setPricesTouched(true) }} placeholder="np. 60"
                className="mt-1 block w-40 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
              {selectedTeacher?.onlineIndividualClientRate != null && (
                <span className="block text-[11px] text-gray-400 mt-0.5">z cennika: {selectedTeacher.onlineIndividualClientRate} zł</span>
              )}
            </label>
            <p className="text-xs text-gray-400 mt-1.5">
              B2B rozlicza fakturą firmową — cena tu jest wyłącznie orientacyjna (kalkulacja kosztu), nie generuje osobnych obciążeń pracownika.
            </p>
          </ModalSection>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <div className="flex items-center gap-3 mt-6">
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50">
            Anuluj
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalSection({ title, icon: Icon, action, children }: {
  title: string
  icon: typeof Wallet
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
          <Icon size={13} className="text-gray-400" />{title}
        </h4>
        {action}
      </div>
      {children}
    </div>
  )
}
