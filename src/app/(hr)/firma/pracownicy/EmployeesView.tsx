'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Video, MapPin, X, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LanguageLevel, LessonType } from '@/types'

type UpcomingLesson = { id: string; startsAt: string; endsAt: string; topic: string; teacherId: string; teacherName: string; type: LessonType }
type Row = {
  id: string; name: string; email: string; level: LanguageLevel; balance: number
  teacherName: string; teacherId: string; present: number; absent: number; upcoming: UpcomingLesson[]
}

function toLocalInput(iso: string) {
  const d = new Date(iso); const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}
function fmt(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function EmployeesView({ rows }: { rows: Row[] }) {
  const router = useRouter()
  const [reschedule, setReschedule] = useState<{ lesson: UpcomingLesson; employee: string } | null>(null)

  async function cancelLesson(id: string) {
    if (!confirm('Odwołać tę lekcję w imieniu pracownika?')) return
    const supabase = createClient()
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) { alert('Nie udało się odwołać: ' + error.message); return }
    router.refresh()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Pracownicy</h1>
        <p className="text-gray-500 mt-1">Frekwencja i nadchodzące lekcje. Możesz odwołać lub przełożyć zajęcia w imieniu pracownika.</p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center text-gray-400 text-sm">Brak przypisanych pracowników.</div>
      ) : (
        <div className="space-y-4">
          {rows.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{e.name}</h3>
                  <p className="text-xs text-gray-400">{e.email} · poziom {e.level} · {e.teacherName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-sm"><CheckCircle size={15} className="text-green-600" /><b>{e.present}</b> <span className="text-gray-400 text-xs">ob.</span></span>
                  <span className="flex items-center gap-1 text-sm"><XCircle size={15} className="text-red-500" /><b>{e.absent}</b> <span className="text-gray-400 text-xs">nieob.</span></span>
                  <span className={`text-sm font-bold ${e.balance < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                    {e.balance < 0 ? `${e.balance} zł` : 'opłacone'}
                  </span>
                </div>
              </div>

              {e.upcoming.length === 0 ? (
                <p className="text-xs text-gray-400">Brak nadchodzących lekcji.</p>
              ) : (
                <div className="space-y-2">
                  {e.upcoming.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                      {l.type === 'online' ? <Video size={15} className="text-[#23479E]" /> : <MapPin size={15} className="text-[#23479E]" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{l.topic || 'Lekcja'}</p>
                        <p className="text-xs text-gray-500">{fmt(l.startsAt)} · {l.teacherName}</p>
                      </div>
                      <button onClick={() => setReschedule({ lesson: l, employee: e.name })} className="text-xs text-[#23479E] hover:underline font-medium">Przełóż</button>
                      <button onClick={() => cancelLesson(l.id)} className="text-xs text-gray-400 hover:text-red-500">Odwołaj</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {reschedule && (
        <RescheduleModal data={reschedule} onClose={() => setReschedule(null)} onSaved={() => { setReschedule(null); router.refresh() }} />
      )}
    </div>
  )
}

function RescheduleModal({ data, onClose, onSaved }: { data: { lesson: UpcomingLesson; employee: string }; onClose: () => void; onSaved: () => void }) {
  const { lesson, employee } = data
  const durationMs = new Date(lesson.endsAt).getTime() - new Date(lesson.startsAt).getTime()
  const [start, setStart] = useState(toLocalInput(lesson.startsAt))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true); setError(null)
    const newStart = new Date(start)
    const newEnd = new Date(newStart.getTime() + durationMs)
    const supabase = createClient()

    // Kolizja nauczyciela – przez funkcję SECURITY DEFINER (HR nie widzi cudzych lekcji)
    const { data: busy } = await supabase.rpc('teacher_busy_slots', {
      p_teacher: lesson.teacherId, p_from: newStart.toISOString(), p_to: newEnd.toISOString(),
    })
    const clash = (busy ?? []).some((b: { starts_at: string; ends_at: string }) =>
      newStart.getTime() < new Date(b.ends_at).getTime() && newEnd.getTime() > new Date(b.starts_at).getTime()
      && new Date(b.starts_at).getTime() !== new Date(lesson.startsAt).getTime())
    if (clash) { setSaving(false); setError('Nauczyciel ma już lekcję w tym terminie.'); return }

    const { error } = await supabase.from('lessons')
      .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() }).eq('id', lesson.id)
    setSaving(false)
    if (error) { setError('Nie udało się przełożyć: ' + error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><Calendar size={18} />Przełóż lekcję</h2>
            <p className="text-xs text-gray-400">{employee} · {lesson.teacherName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nowy termin</label>
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60">
            {saving ? 'Zapis...' : 'Zapisz termin'}
          </button>
        </div>
      </div>
    </div>
  )
}
