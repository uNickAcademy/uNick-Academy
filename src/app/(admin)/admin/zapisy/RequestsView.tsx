'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Clock, Check, X, Mail, Phone } from 'lucide-react'

type Row = {
  id: string; createdAt: string; status: string; fullName: string; email: string; phone: string
  level: string; age: number | null; address: string; notes: string; slots: string[]; approvedRate: number | null
}
type TeacherOpt = { id: string; name: string }

export function RequestsView({ rows, teacherOptions }: { rows: Row[]; teacherOptions: TeacherOpt[] }) {
  const pending = rows.filter((r) => r.status === 'pending')
  const handled = rows.filter((r) => r.status !== 'pending')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Prośby o zapis (stacjonarne)</h1>
        <p className="text-gray-500 mt-1">Zaakceptuj termin i stawkę lub odrzuć</p>
      </div>

      {pending.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">Brak oczekujących próśb.</p>}
      <div className="space-y-4">
        {pending.map((r) => <RequestCard key={r.id} r={r} teacherOptions={teacherOptions} />)}
      </div>

      {handled.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Obsłużone</h2>
          <div className="space-y-2">
            {handled.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-gray-900">{r.fullName}</span>
                  <span className="text-gray-400 ml-2">{r.address}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${r.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {r.status === 'approved' ? `Zaakceptowano${r.approvedRate ? ` · ${r.approvedRate} zł` : ''}` : 'Odrzucono'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const DURATION_OPTIONS = [20, 30, 40, 60]

function RequestCard({ r, teacherOptions }: { r: Row; teacherOptions: TeacherOpt[] }) {
  const router = useRouter()
  const [teacherId, setTeacherId] = useState(teacherOptions[0]?.id ?? '')
  const [slot, setSlot] = useState('')
  const [rate, setRate] = useState('')
  const [duration, setDuration] = useState<number | 'custom'>(60)
  const [customDuration, setCustomDuration] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const durationMinutes = duration === 'custom' ? Number(customDuration) : duration

  async function act(action: 'approve' | 'reject') {
    setError(null)
    if (action === 'approve' && (!teacherId || !slot)) { setError('Wybierz nauczyciela i termin.'); return }
    if (action === 'approve' && (!durationMinutes || durationMinutes <= 0)) { setError('Podaj poprawny czas zajęć.'); return }
    setBusy(true)
    const res = await fetch('/api/admin/booking-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, action, teacherId, slot: slot ? new Date(slot).toISOString() : null, rate, durationMinutes }),
    })
    setBusy(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Błąd.'); return }
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{r.fullName} {r.age ? <span className="text-sm text-gray-400">· {r.age} lat</span> : null}</h3>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1"><Mail size={11} />{r.email}</span>
            {r.phone && <span className="flex items-center gap-1"><Phone size={11} />{r.phone}</span>}
            <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">{r.level}</span>
          </div>
        </div>
        <span className="text-xs text-gray-400">{r.createdAt}</span>
      </div>

      <div className="text-sm text-gray-600 space-y-2 mb-4">
        <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />{r.address}</p>
        {r.slots.length > 0 && (
          <div className="flex items-start gap-2">
            <Clock size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {r.slots.map((s, i) => <span key={i} className="text-xs bg-[#EAF3FF] text-[#23479E] px-2 py-0.5 rounded font-medium">{s}</span>)}
            </div>
          </div>
        )}
        {r.notes && <p className="text-xs text-gray-400">{r.notes}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-gray-100 pt-4">
        <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
          {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input type="datetime-local" value={slot} onChange={(e) => setSlot(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        <div className="flex gap-2">
          <select value={duration} onChange={(e) => setDuration(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
            {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
            <option value="custom">Inny...</option>
          </select>
          {duration === 'custom' && (
            <input type="number" value={customDuration} onChange={(e) => setCustomDuration(e.target.value)} placeholder="min"
              className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          )}
        </div>
        <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Stawka zł/h"
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
      </div>
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button onClick={() => act('approve')} disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50">
          <Check size={16} />Zaakceptuj termin i stawkę</button>
        <button onClick={() => act('reject')} disabled={busy}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 disabled:opacity-50">
          <X size={16} />Odrzuć</button>
      </div>
    </div>
  )
}
