'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Lesson } from '@/types'

// Lekcje, które faktycznie się odbyły (przeszłość) — z możliwością trwałego
// usunięcia wpisu wprowadzonego przez pomyłkę (np. duplikat, zły termin), żeby
// nie był liczony do opłaty. To nie to samo co odwołanie: odwołanie zostawia
// ślad w historii, usunięcie kasuje wiersz, który w ogóle nie powinien istnieć.
export function LessonHistory({ lessons }: { lessons: Lesson[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(l: Lesson) {
    if (!confirm(`Usunąć tę lekcję na stałe?\n\n${l.topic || 'Lekcja'}\n\nUżyj tylko wtedy, gdy wiesz, że zajęcia się nie odbyły (np. błędny wpis) — nie będzie liczona do opłaty.`)) return
    setBusyId(l.id); setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('lessons').delete().eq('id', l.id)
    setBusyId(null)
    if (error) { setError('Nie udało się usunąć: ' + error.message); return }
    router.refresh()
  }

  if (lessons.length === 0) return <p className="text-sm text-gray-400">Brak lekcji, które się odbyły.</p>

  return (
    <div>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {lessons.map((l) => (
          <div key={l.id} className="flex items-center gap-3 text-sm group">
            <span className="text-xs text-gray-400 w-28 flex-shrink-0">{new Date(l.starts_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: '2-digit', timeZone: 'Europe/Warsaw' })} {new Date(l.starts_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' })}</span>
            <span className="flex-1 truncate text-gray-700">{l.topic || 'Lekcja'}</span>
            {(l.attendance === 'present' || l.attendance === 'scheduled') && <CheckCircle size={14} className="text-green-600 flex-shrink-0" />}
            {(l.attendance === 'absent' || l.attendance === 'no_show') && <XCircle size={14} className="text-red-500 flex-shrink-0" />}
            {l.attendance === 'late_cancellation' && <span className="text-xs text-orange-600 flex-shrink-0">późne odwoł.</span>}
            {l.attendance === 'excused' && <span className="text-xs text-amber-600 flex-shrink-0">do odrob.</span>}
            <button onClick={() => remove(l)} disabled={busyId === l.id} title="Usuń lekcję na stałe (nie liczy się do opłaty)"
              className="text-gray-300 hover:text-red-500 flex-shrink-0 disabled:opacity-40">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
