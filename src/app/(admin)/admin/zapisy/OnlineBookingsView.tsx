'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Check, X, Mail, Phone, Link2, Repeat } from 'lucide-react'

export type OnlineRow = {
  studentId: string
  studentName: string
  email: string
  phone: string
  teacherId: string
  teacherName: string
  firstStartsAtLabel: string
  firstStartsAtInput: string
  lessonCount: number
  meetingUrl: string
  monthlyPrice: number | null
  createdAt: string
}
type TeacherOpt = { id: string; name: string }

export function OnlineBookingsView({ rows, teacherOptions }: { rows: OnlineRow[]; teacherOptions: TeacherOpt[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-6 text-center">Brak zapisów online oczekujących na zatwierdzenie.</p>
    )
  }
  return (
    <div className="space-y-4">
      {rows.map((r) => <OnlineCard key={`${r.studentId}-${r.teacherId}`} r={r} teacherOptions={teacherOptions} />)}
    </div>
  )
}

function OnlineCard({ r, teacherOptions }: { r: OnlineRow; teacherOptions: TeacherOpt[] }) {
  const router = useRouter()
  const [teacherId, setTeacherId] = useState(r.teacherId)
  const [slot, setSlot] = useState(r.firstStartsAtInput)
  const [meetingUrl, setMeetingUrl] = useState(r.meetingUrl)
  const [firstAmount, setFirstAmount] = useState('')
  const [monthlyPrice, setMonthlyPrice] = useState(r.monthlyPrice != null ? String(r.monthlyPrice) : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function act(action: 'approve' | 'reject') {
    setError(null)
    if (action === 'reject' && !confirm(`Odrzucić zapis ${r.studentName}? Zaplanowane lekcje zostaną usunięte.`)) return
    if (action === 'approve' && !slot) { setError('Podaj termin pierwszej lekcji.'); return }
    setBusy(true)
    const res = await fetch('/api/admin/online-bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: r.studentId, teacherId: r.teacherId, action,
        newTeacherId: teacherId,
        slot: slot ? new Date(slot).toISOString() : null,
        meetingUrl, firstAmount, monthlyPrice,
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
        Wybrany termin: <span className="font-semibold text-gray-900">{r.firstStartsAtLabel}</span>
        <span className="text-gray-400"> · {r.teacherName}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-gray-100 pt-4">
        <label className="text-xs text-gray-500">
          Nauczyciel
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:border-[#23479E]">
            {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-500">
          Termin pierwszej lekcji
          <input type="datetime-local" value={slot} onChange={(e) => setSlot(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
        </label>
        <label className="text-xs text-gray-500 sm:col-span-2">
          <span className="flex items-center gap-1"><Link2 size={11} />Link do zajęć</span>
          <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://meet.jit.si/..."
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
        </label>
        <label className="text-xs text-gray-500">
          Opłata za pierwszą lekcję (zł)
          <input type="number" min={0} value={firstAmount} onChange={(e) => setFirstAmount(e.target.value)} placeholder="np. 90"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
        </label>
        <label className="text-xs text-gray-500">
          Abonament miesięczny (zł)
          <input type="number" min={0} value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} placeholder="np. 390"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#23479E]" />
        </label>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Po zatwierdzeniu uczeń dostanie maila z potwierdzonym terminem, linkiem do zajęć i linkiem do płatności za
        pierwszą lekcję. Abonament będzie doliczany 1. dnia każdego miesiąca z góry.
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
