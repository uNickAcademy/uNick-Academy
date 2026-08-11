'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { t, type Lang } from '@/lib/i18n'

// Zgłoszenie nieobecności. Odwołane z wyprzedzeniem (≥24h) zajęcia trafiają
// do sekcji „Saldo zajęć do odrobienia" (MakeupBalance) powyżej listy lekcji —
// tam uczeń proponuje termin odrobienia, a nauczyciel go zatwierdza (albo
// odwrotnie). Spóźnione odwołanie (<24h) przepada bez możliwości odrobienia.
export function MakeupActions({
  lessonId,
  startsAt,
  lang,
}: {
  lessonId: string
  startsAt: string
  lang: Lang
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'reported' | 'late_cancelled'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function reportAbsence() {
    const hoursUntil = (new Date(startsAt).getTime() - Date.now()) / 3_600_000
    const inTime = hoursUntil >= 24
    // Potwierdzenie zależne od tego, czy mieści się w 24h
    const msg = inTime
      ? `${t(lang, 'cancel_lesson_q')} ${t(lang, 'cancel_ge24_info')}`
      : t(lang, 'cancel_lt24_confirm')
    if (!confirm(msg)) return
    setError(null)
    const supabase = createClient()
    const status = inTime ? 'excused' : 'late_cancellation'
    const { error } = await supabase.from('lessons').update({ attendance: status }).eq('id', lessonId)
    if (error) { setError('Nie udało się zgłosić: ' + error.message); return }
    // powiadom prowadzącego (nie blokuje UI)
    fetch('/api/notify/makeup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, kind: inTime ? 'absence' : 'late_cancel' }),
    }).catch(() => {})
    if (inTime) {
      setPhase('reported')
      setTimeout(() => router.refresh(), 1500)
    } else {
      setPhase('late_cancelled')
      setTimeout(() => router.refresh(), 2000)
    }
  }

  if (phase === 'late_cancelled') {
    return (
      <div className="mt-3 pt-3 border-t border-gray-50">
        <p className="text-xs text-orange-600 font-medium flex items-center gap-1.5"><X size={13} />{t(lang, 'late_cancel_done')}</p>
      </div>
    )
  }

  if (phase === 'reported') {
    return (
      <div className="mt-3 pt-3 border-t border-gray-50">
        <p className="text-xs text-amber-600 font-medium">{t(lang, 'absence_reported')}.</p>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-50">
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <button onClick={reportAbsence}
        className="text-xs text-gray-500 hover:text-red-500 font-medium flex items-center gap-1.5 transition-colors">
        <X size={13} />{t(lang, 'report_absence')}
      </button>
    </div>
  )
}
