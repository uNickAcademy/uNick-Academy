'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Repeat, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Sub = {
  id: string; lessonId: string; reason: string; status: string; createdAt: string
  startsAt: string; student: string; topic: string; originalTeacher: string; substituteTeacher: string | null
}

export function SubstitutionsView({ subs, teacherOptions }: { subs: Sub[]; teacherOptions: { id: string; name: string }[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [picks, setPicks] = useState<Record<string, string>>({})

  const requested = subs.filter((s) => s.status === 'requested')
  const assigned = subs.filter((s) => s.status === 'assigned')

  async function assign(sub: Sub) {
    const subTeacherId = picks[sub.id]
    if (!subTeacherId) { alert('Wybierz zastępcę.'); return }
    setBusy(sub.id)
    const supabase = createClient()
    // przypisz zastępstwo
    const { error: e1 } = await supabase.from('substitutions')
      .update({ substitute_teacher_id: subTeacherId, status: 'assigned' }).eq('id', sub.id)
    // przepnij lekcję na zastępcę (pojawi się w jego kalendarzu/dzienniku)
    const { error: e2 } = await supabase.from('lessons').update({ teacher_id: subTeacherId }).eq('id', sub.lessonId)
    setBusy(null)
    if (e1 || e2) { alert('Nie udało się przypisać: ' + (e1?.message || e2?.message)); return }
    router.refresh()
  }

  function fmt(iso: string) {
    return iso ? new Date(iso).toLocaleString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6"><Repeat size={22} />Zastępstwa</h1>

      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Zgłoszone — do przypisania ({requested.length})</h2>
        {requested.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center text-gray-400 text-sm">Brak nowych zgłoszeń.</div>
        ) : (
          <div className="space-y-3">
            {requested.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{s.student}</p>
                    <p className="text-xs text-gray-500">{fmt(s.startsAt)} · {s.topic || 'Lekcja'} · zgłosił/a: {s.originalTeacher}</p>
                    {s.reason && <p className="text-xs text-gray-400 mt-1">Powód: {s.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={picks[s.id] ?? ''} onChange={(e) => setPicks((p) => ({ ...p, [s.id]: e.target.value }))}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                      <option value="">Wybierz zastępcę...</option>
                      {teacherOptions.filter((t) => t.name !== s.originalTeacher).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button onClick={() => assign(s)} disabled={busy === s.id}
                      className="px-4 py-2 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5">
                      <Check size={15} />Przypisz
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Przypisane zastępstwa ({assigned.length})</h2>
        {assigned.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center text-gray-400 text-sm">Brak przypisanych zastępstw.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Termin</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Z (oryg.)</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Zastępca</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assigned.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{fmt(s.startsAt)}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{s.student}</td>
                    <td className="px-5 py-3 text-gray-500">{s.originalTeacher}</td>
                    <td className="px-5 py-3 font-semibold text-[#23479E]">{s.substituteTeacher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
