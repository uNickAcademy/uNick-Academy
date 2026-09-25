'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Status = 'awaiting_payment' | 'paid' | 'cancelled'

const LABEL: Record<Status, string> = {
  awaiting_payment: 'Oczekuje na wpłatę',
  paid: 'Opłacone',
  cancelled: 'Anulowane',
}

const STYLE: Record<Status, string> = {
  awaiting_payment: 'bg-amber-50 text-amber-800 border-amber-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

/**
 * Ręczna zmiana statusu zgłoszenia na bal.
 *
 * Świadomie nie ma tu żadnej automatyki: udział potwierdza człowiek po
 * zobaczeniu wpłaty na rachunku Fundacji (§2 ust. 4 regulaminu). „Opłacone"
 * ustawia datę zaksięgowania, bo baza wymaga jej przy tym statusie.
 */
export function BallStatus({ id, status }: { id: string; status: Status }) {
  const router = useRouter()
  const [current, setCurrent] = useState<Status>(status)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function change(next: Status) {
    if (busy || next === current) return
    if (next === 'cancelled' && !confirm('Anulować to zgłoszenie?')) return
    setBusy(true)
    setError(null)

    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('ball_registrations')
      .update({ status: next, paid_at: next === 'paid' ? new Date().toISOString() : null })
      .eq('id', id)

    setBusy(false)
    if (dbError) { setError(dbError.message); return }
    setCurrent(next)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STYLE[current]}`}>
        {LABEL[current]}
      </span>
      {(['awaiting_payment', 'paid', 'cancelled'] as Status[])
        .filter((s) => s !== current)
        .map((s) => (
          <button key={s} type="button" onClick={() => change(s)} disabled={busy}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:opacity-50">
            {s === 'paid' ? 'Oznacz jako opłacone' : s === 'cancelled' ? 'Anuluj' : 'Cofnij do oczekujących'}
          </button>
        ))}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
