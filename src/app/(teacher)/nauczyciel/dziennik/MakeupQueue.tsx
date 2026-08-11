'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Check, X, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import type { MakeupBalanceItem } from '@/types'

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

// Odwołane zajęcia uczniów tego nauczyciela, którym nie towarzyszy jeszcze
// zaakceptowany termin odrobienia. Nauczyciel może zaproponować własny termin
// albo odpowiedzieć na propozycję ucznia.
export function MakeupQueue({ items }: { items: MakeupBalanceItem[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden mb-6">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0"><Clock size={18} /></div>
          <div className="text-left">
            <p className="font-bold text-gray-900">Zajęcia do odrobienia: {items.length}</p>
            <p className="text-xs text-gray-500">Zaproponuj termin albo odpowiedz na propozycję ucznia</p>
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {items.map((it) => <MakeupRow key={it.lessonId} item={it} onChanged={() => router.refresh()} />)}
        </div>
      )}
    </div>
  )
}

function MakeupRow({ item, onChanged }: { item: MakeupBalanceItem; onChanged: () => void }) {
  const durationMs = new Date(item.originalEndsAt).getTime() - new Date(item.originalStartsAt).getTime()
  const [proposing, setProposing] = useState(false)
  const [when, setWhen] = useState(() => toLocalInput(new Date(Date.now() + 86400000)))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const proposal = item.activeProposal

  async function propose() {
    setBusy(true); setError(null)
    const start = new Date(when)
    const end = new Date(start.getTime() + durationMs)
    const res = await fetch('/api/makeup/propose', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: item.lessonId, startsAt: start.toISOString(), endsAt: end.toISOString() }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error || 'Nie udało się wysłać propozycji.'); return }
    setProposing(false)
    onChanged()
  }

  async function respond(action: 'accept' | 'decline' | 'cancel') {
    if (!proposal) return
    setBusy(true); setError(null)
    const res = await fetch('/api/makeup/respond', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId: proposal.id, action }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error || 'Nie udało się zapisać odpowiedzi.'); return }
    onChanged()
  }

  return (
    <div className="px-5 py-4">
      <p className="text-sm font-semibold text-gray-800">{item.studentName} · odwołane {fmtDate(item.originalStartsAt)}</p>

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

      {!proposal && !proposing && (
        <button onClick={() => setProposing(true)}
          className="mt-2 text-xs text-[#23479E] hover:underline font-semibold flex items-center gap-1.5">
          <Calendar size={13} />Zaproponuj termin
        </button>
      )}

      {!proposal && proposing && (
        <div className="mt-2 flex items-center gap-2">
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#23479E]" />
          <button onClick={propose} disabled={busy}
            className="text-xs bg-[#23479E] text-white px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50">
            Wyślij
          </button>
          <button onClick={() => setProposing(false)} className="text-xs text-gray-400 hover:text-gray-600">Anuluj</button>
        </div>
      )}

      {proposal && proposal.proposed_by === 'teacher' && (
        <div className="mt-2 flex items-center gap-3">
          <p className="text-xs text-amber-600 font-medium">Czekasz na akceptację ucznia: {fmt(proposal.proposed_starts_at)}</p>
          <button onClick={() => respond('cancel')} disabled={busy} className="text-xs text-gray-400 hover:text-red-500">Wycofaj</button>
        </div>
      )}

      {proposal && proposal.proposed_by === 'student' && (
        <div className="mt-2">
          <p className="text-xs text-[#23479E] font-medium mb-1.5">Uczeń proponuje: {fmt(proposal.proposed_starts_at)}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => respond('accept')} disabled={busy}
              className="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
              <Check size={12} />Akceptuj
            </button>
            <button onClick={() => respond('decline')} disabled={busy}
              className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1">
              <X size={12} />Odrzuć
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
