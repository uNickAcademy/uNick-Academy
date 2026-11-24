'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Status = 'new' | 'confirmed' | 'waitlist' | 'cancelled'

const LABEL: Record<Status, string> = {
  new: 'Nowe',
  confirmed: 'Potwierdzone',
  waitlist: 'Lista rezerwowa',
  cancelled: 'Anulowane',
}

const STYLE: Record<Status, string> = {
  new: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  waitlist: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

/**
 * Ręczna zmiana statusu zgłoszenia na Winter Project Week. Nic nie dzieje się
 * automatycznie: miejsca (20) przydziela człowiek, z pierwszeństwem dla osób
 * z regularnych zajęć.
 */
export function WinterStatus({ id, status }: { id: string; status: Status }) {
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
      .from('winter_week_registrations')
      .update({ status: next })
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
      {(Object.keys(LABEL) as Status[])
        .filter((s) => s !== current)
        .map((s) => (
          <button key={s} type="button" onClick={() => change(s)} disabled={busy}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:opacity-50">
            {LABEL[s]}
          </button>
        ))}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
