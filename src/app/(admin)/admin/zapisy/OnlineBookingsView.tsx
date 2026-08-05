'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Monitor, Check, X, Mail, Phone, Link2, Repeat, Plus, Trash2,
  CalendarRange, CalendarOff, Wallet, Banknote,
} from 'lucide-react'
import { generateLessons, lessonsPerMonth, DAYS_PL_SHORT, type Slot } from '@/lib/lessons/schedule'

export type OnlineRow = {
  studentId: string
  studentName: string
  email: string
  phone: string
  teacherId: string
  teacherName: string
  firstStartsAtLabel: string
  firstStartsAtInput: string
  firstDate: string
  firstTime: string
  firstDay: number
  durationMinutes: number
  lessonCount: number
  meetingUrl: string
  monthlyPrice: number | null
  createdAt: string
}
type TeacherOpt = {
  id: string
  name: string
  onlineIndividualPayRate: number | null
  onlineIndividualClientRate: number | null
}

export function OnlineBookingsView({ rows, teacherOptions, breakDates }: {
  rows: OnlineRow[]
  teacherOptions: TeacherOpt[]
  breakDates: string[]
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 py-6 text-center">Brak zapisów online oczekujących na zatwierdzenie.</p>
  }
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <OnlineCard key={`${r.studentId}-${r.teacherId}`} r={r} teacherOptions={teacherOptions} breakDates={breakDates} />
      ))}
    </div>
  )
}

/** Domyślny koniec kursu: najbliższy 30 czerwca po dacie startu. */
function defaultEndDate(start: string): string {
  const year = Number(start.slice(0, 4))
  const endThisYear = `${year}-06-30`
  return start <= endThisYear ? endThisYear : `${year + 1}-06-30`
}

const zl = (n: number) => `${Math.round(n).toLocaleString('pl-PL')} zł`

function OnlineCard({ r, teacherOptions, breakDates }: {
  r: OnlineRow; teacherOptions: TeacherOpt[]; breakDates: string[]
}) {
  const router = useRouter()
  const initialTeacher = teacherOptions.find((t) => t.id === r.teacherId)
  const [teacherId, setTeacherId] = useState(r.teacherId)
  const selectedTeacher = teacherOptions.find((t) => t.id === teacherId) ?? initialTeacher
  const [meetingUrl, setMeetingUrl] = useState(r.meetingUrl)

  const [slots, setSlots] = useState<Slot[]>([
    { day: r.firstDay, time: r.firstTime, durationMin: r.durationMinutes },
  ])
  const [startDate, setStartDate] = useState(r.firstDate)
  const [endDate, setEndDate] = useState(defaultEndDate(r.firstDate))
  const [excludedDates, setExcludedDates] = useState<string[]>([])
  const [newExcluded, setNewExcluded] = useState('')

  // Startują z domyślnej stawki nauczyciela z /admin/nauczyciele (cennik
  // szkoły) — admin może je dowolnie nadpisać dla tego konkretnego kursu.
  const [lessonPrice, setLessonPrice] = useState(
    initialTeacher?.onlineIndividualClientRate != null ? String(initialTeacher.onlineIndividualClientRate) : '',
  )
  const [teacherRate, setTeacherRate] = useState(
    initialTeacher?.onlineIndividualPayRate != null ? String(initialTeacher.onlineIndividualPayRate) : '',
  )
  const [pricesTouched, setPricesTouched] = useState(false)
  const [paymentMode, setPaymentMode] = useState<'monthly' | 'upfront'>('monthly')

  // Zmiana prowadzącego podmienia podpowiedź cenową — ale tylko dopóki admin
  // ręcznie nie zaczął jej edytować, żeby nie nadpisać świadomej korekty.
  function selectTeacher(id: string) {
    setTeacherId(id)
    if (pricesTouched) return
    const t = teacherOptions.find((opt) => opt.id === id)
    setLessonPrice(t?.onlineIndividualClientRate != null ? String(t.onlineIndividualClientRate) : '')
    setTeacherRate(t?.onlineIndividualPayRate != null ? String(t.onlineIndividualPayRate) : '')
  }

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Podgląd liczy się tym samym generatorem co serwer — razem z przerwami
  // szkolnymi, więc liczba lekcji i wartość kursu nie rozjadą się po zapisie.
  const schedule = useMemo(
    () => generateLessons({ slots, startDate, endDate, excludedDates: [...excludedDates, ...breakDates] }),
    [slots, startDate, endDate, excludedDates, breakDates],
  )
  const price = Number(lessonPrice) || 0
  const courseTotal = price * schedule.length
  const months = useMemo(() => Object.entries(lessonsPerMonth(schedule)).sort(), [schedule])
  const firstMonth = months[0]

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

  async function act(action: 'approve' | 'reject') {
    setError(null)
    if (action === 'reject' && !confirm(`Odrzucić zapis ${r.studentName}? Zaplanowane lekcje zostaną usunięte.`)) return
    if (action === 'approve') {
      if (schedule.length === 0) { setError('Ta konfiguracja nie daje żadnej lekcji — sprawdź terminy i czas trwania.'); return }
      if (!confirm(
        `Zatwierdzić kurs dla ${r.studentName}?\n\n` +
        `${schedule.length} zajęć od ${startDate} do ${endDate}\n` +
        (price > 0 ? `Wartość kursu: ${courseTotal} zł (${schedule.length} × ${price} zł)\n` : '') +
        (paymentMode === 'upfront' ? 'Klient płaci całość z góry.' : `Do zapłaty teraz: ${firstMonth ? firstMonth[1] * price : 0} zł za pierwszy miesiąc.`)
      )) return
    }
    setBusy(true)
    const res = await fetch('/api/admin/online-bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: r.studentId, teacherId: r.teacherId, action,
        newTeacherId: teacherId, meetingUrl,
        slots, startDate, endDate, excludedDates,
        lessonPrice, teacherRate, paymentMode,
      }),
    })
    setBusy(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Błąd.'); return }
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Monitor size={15} className="text-blue-500 flex-shrink-0" />
            <span className="truncate">{r.studentName}</span>
          </h3>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
            {r.email && <span className="flex items-center gap-1"><Mail size={11} />{r.email}</span>}
            {r.phone && <span className="flex items-center gap-1"><Phone size={11} />{r.phone}</span>}
            {r.lessonCount > 1 && (
              <span className="flex items-center gap-1 text-violet-600 font-medium">
                <Repeat size={11} />{r.lessonCount} lekcji (cykliczne)
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{r.createdAt}</span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Zgłoszony termin: <span className="font-semibold text-gray-900">{r.firstStartsAtLabel}</span>
        <span className="text-gray-400"> · {r.teacherName}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-gray-100 pt-4">
        <label className="text-xs text-gray-500">
          Prowadzący
          <select value={teacherId} onChange={(e) => selectTeacher(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:border-[#23479E]">
            {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-500">
          <span className="flex items-center gap-1"><Link2 size={11} />Link do zajęć</span>
          <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://meet.jit.si/..."
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
        </label>
      </div>

      {/* Terminy zajęć */}
      <Section title="Termin zajęć" icon={Repeat}
        action={<button onClick={addSlot} className="flex items-center gap-1 text-xs font-semibold text-[#23479E] hover:underline">
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
                <button onClick={() => removeSlot(i)} title="Usuń termin"
                  className="p-2 mb-0.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Harmonogram */}
      <Section title="Harmonogram zajęć" icon={CalendarRange}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-xs text-gray-500">
            Początek kursu
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
          </label>
          <label className="text-xs text-gray-500">
            Koniec kursu
            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
          </label>
        </div>

        <div className="mt-3">
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><CalendarOff size={11} />Wyłączone dni</p>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={newExcluded} min={startDate} max={endDate}
              onChange={(e) => setNewExcluded(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
            <button onClick={addExcluded} disabled={!newExcluded}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              Dodaj
            </button>
            {excludedDates.map((d) => (
              <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-700">
                {d}
                <button onClick={() => setExcludedDates((prev) => prev.filter((x) => x !== d))}
                  className="text-gray-400 hover:text-red-500"><X size={12} /></button>
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Ferie i przerwy świąteczne z kalendarza szkoły są pomijane automatycznie — tu dodaj tylko dodatkowe dni.
          </p>
        </div>
      </Section>

      {/* Pensja */}
      <Section title="Pensja prowadzącego" icon={Banknote}>
        <label className="text-xs text-gray-500">
          Stawka za lekcję (zł)
          <input type="number" min={0} value={teacherRate}
            onChange={(e) => { setTeacherRate(e.target.value); setPricesTouched(true) }} placeholder="np. 90"
            className="mt-1 block w-40 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
        </label>
        <p className="text-xs text-gray-400 mt-1.5">
          {selectedTeacher?.onlineIndividualPayRate != null
            ? 'Podpowiedź z cennika nauczyciela — zmień, jeśli ten kurs rozliczacie inaczej.'
            : 'Puste = stawka z kartoteki nauczyciela.'}
          {teacherRate && schedule.length > 0 && (
            <> Koszt kursu: <strong className="text-gray-600">{zl(Number(teacherRate) * schedule.length)}</strong>.</>
          )}
        </p>
      </Section>

      {/* Cennik */}
      <Section title="Cennik i rozliczenia" icon={Wallet}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-xs text-gray-500">
            Cena za zajęcia (zł)
            <input type="number" min={0} value={lessonPrice}
              onChange={(e) => { setLessonPrice(e.target.value); setPricesTouched(true) }} placeholder="np. 75"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
            {selectedTeacher?.onlineIndividualClientRate != null && (
              <span className="block text-[11px] text-gray-400 mt-0.5">z cennika: {selectedTeacher.onlineIndividualClientRate} zł</span>
            )}
          </label>
          <label className="text-xs text-gray-500">
            Klient płaci
            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as 'monthly' | 'upfront')}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:border-[#23479E]">
              <option value="monthly">co miesiąc</option>
              <option value="upfront">całość z góry</option>
            </select>
          </label>
        </div>
      </Section>

      {/* Podsumowanie */}
      <div className="mt-4 rounded-xl bg-[#F5F8FF] border border-[#dbe6ff] px-4 py-3 text-sm">
        {schedule.length === 0 ? (
          <p className="text-red-500">Ta konfiguracja nie daje żadnej lekcji — sprawdź terminy i czas trwania.</p>
        ) : (
          <>
            <p className="text-gray-900 font-semibold">
              {schedule.length} zajęć
              {price > 0 && <> · wartość kursu <span className="text-[#23479E]">{zl(courseTotal)}</span></>}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              od {startDate} do {endDate}
              {excludedDates.length > 0 && ` · pominięto ${excludedDates.length} dni`}
              {price > 0 && firstMonth && (
                paymentMode === 'upfront'
                  ? ` · do zapłaty teraz całość ${zl(courseTotal)}`
                  : ` · do zapłaty teraz ${zl(firstMonth[1] * price)} za pierwszy miesiąc (${firstMonth[1]} zajęć)`
              )}
            </p>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Po zatwierdzeniu powstaje cała seria terminów, a uczeń dostaje maila z potwierdzeniem, linkiem do zajęć
        i linkiem do płatności. {paymentMode === 'upfront'
          ? 'Całość kursu naliczamy od razu, rozpisaną na miesiące — cron nie doliczy niczego drugi raz.'
          : 'Kolejne miesiące naliczają się 1. dnia miesiąca z góry.'}
      </p>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button onClick={() => act('approve')} disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50">
          <Check size={16} />{busy ? 'Zapisywanie...' : 'Zatwierdź i wyślij płatność'}</button>
        <button onClick={() => act('reject')} disabled={busy}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 disabled:opacity-50">
          <X size={16} />Odrzuć</button>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, action, children }: {
  title: string
  icon: typeof Wallet
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
          <Icon size={13} className="text-gray-400" />{title}
        </h4>
        {action}
      </div>
      {children}
    </div>
  )
}
