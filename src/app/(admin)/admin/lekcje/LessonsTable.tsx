'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Video, MapPin, Calendar, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LanguageLevel, LessonType } from '@/types'

type Row = {
  id: string
  student: string
  teacherId: string
  teacher: string
  startsAt: string
  endsAt: string
  topic: string
  level: LanguageLevel
  type: LessonType
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}
// yyyy-MM-ddTHH:mm dla input datetime-local (czas lokalny)
function toLocalInput(iso: string) {
  const d = new Date(iso)
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

export function LessonsTable({ rows, teacherOptions }: { rows: Row[]; teacherOptions: { id: string; name: string }[] }) {
  const router = useRouter()
  const [teacherFilter, setTeacherFilter] = useState('')
  const [period, setPeriod] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [reschedule, setReschedule] = useState<Row | null>(null)

  const now = Date.now()
  const filtered = rows.filter((r) => {
    if (teacherFilter && r.teacherId !== teacherFilter) return false
    const start = new Date(r.startsAt).getTime()
    if (period === 'upcoming' && start < now) return false
    if (period === 'past' && start >= now) return false
    return true
  })

  async function cancelLesson(id: string) {
    if (!confirm('Odwołać tę lekcję? Tej operacji nie można cofnąć.')) return
    const supabase = createClient()
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) { alert('Nie udało się odwołać: ' + error.message); return }
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Lekcje</h1>
        <Link href="/admin/kalendarz"
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Dodaj lekcję
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
          <option value="">Wszyscy nauczyciele</option>
          {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {(['upcoming', 'past', 'all'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${period === p ? 'bg-[#23479E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {p === 'upcoming' ? 'Nadchodzące' : p === 'past' ? 'Minione' : 'Wszystkie'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nauczyciel</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Termin</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Temat</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Poziom</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Typ</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{l.student}</td>
                  <td className="px-5 py-4 text-gray-700">{l.teacher}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Calendar size={13} className="text-gray-400" />
                      <span>{fmtDate(l.startsAt)} · {fmtTime(l.startsAt)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-700">{l.topic || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded bg-[#EAF3FF] text-[#23479E] text-xs font-bold">{l.level}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${l.type === 'online' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {l.type === 'online' ? <Video size={11} /> : <MapPin size={11} />}
                      {l.type === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <button onClick={() => setReschedule(l)} className="text-xs text-[#23479E] hover:underline font-medium mr-3">Przełóż</button>
                    <button onClick={() => cancelLesson(l.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Odwołaj</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">Brak lekcji dla wybranych filtrów.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">{filtered.length} lekcji</div>
      </div>

      {reschedule && (
        <RescheduleModal row={reschedule} onClose={() => setReschedule(null)} onSaved={() => { setReschedule(null); router.refresh() }} />
      )}
    </div>
  )
}

function RescheduleModal({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const durationMs = new Date(row.endsAt).getTime() - new Date(row.startsAt).getTime()
  const [start, setStart] = useState(toLocalInput(row.startsAt))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const newStart = new Date(start)
    const newEnd = new Date(newStart.getTime() + durationMs)
    const supabase = createClient()

    // Detekcja kolizji: ta sama osoba (nauczyciel), inny rekord, nakładające się terminy
    const { data: conflicts } = await supabase
      .from('lessons')
      .select('id, starts_at, ends_at')
      .eq('teacher_id', row.teacherId)
      .neq('id', row.id)
      .lt('starts_at', newEnd.toISOString())
      .gt('ends_at', newStart.toISOString())

    if (conflicts && conflicts.length > 0) {
      setSaving(false)
      setError('Kolizja: nauczyciel ma już lekcję w tym czasie.')
      return
    }

    const { error } = await supabase
      .from('lessons')
      .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() })
      .eq('id', row.id)
    setSaving(false)
    if (error) { setError('Nie udało się zapisać: ' + error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">Przełóż lekcję</h2>
            <p className="text-xs text-gray-400">{row.student} · {row.teacher}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nowy termin</label>
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="flex items-center gap-3 mt-6">
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? 'Zapisywanie...' : 'Zapisz nowy termin'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50">Anuluj</button>
        </div>
      </div>
    </div>
  )
}
