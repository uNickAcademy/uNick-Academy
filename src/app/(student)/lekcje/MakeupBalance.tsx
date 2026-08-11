'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Check, X, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { suggestTeacherSlots, type SuggestedSlot } from '@/lib/lessons/suggestSlots'
import type { MakeupBalanceItem } from '@/types'
import { t, type Lang } from '@/lib/i18n'

function fmtDate(iso: string, lang: Lang) {
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtDateTime(iso: string, lang: Lang) {
  return new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'pl-PL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Uczeń widzi tu wszystkie odwołane zajęcia, którym nie towarzyszy jeszcze
// zaakceptowany termin odrobienia — może zaproponować termin albo odpowiedzieć
// na propozycję nauczyciela.
export function MakeupBalance({ items, lang }: { items: MakeupBalanceItem[]; lang: Lang }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null

  return (
    <div className="mb-8 bg-white rounded-2xl border border-amber-200 overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0"><Clock size={18} /></div>
          <div className="text-left">
            <p className="font-bold text-gray-900">{t(lang, 'makeup_balance_title')}: {items.length}</p>
            <p className="text-xs text-gray-500">{t(lang, 'makeup_balance_hint')}</p>
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {items.map((it) => <MakeupItemRow key={it.lessonId} item={it} lang={lang} onChanged={() => router.refresh()} />)}
        </div>
      )}
    </div>
  )
}

function MakeupItemRow({ item, lang, onChanged }: { item: MakeupBalanceItem; lang: Lang; onChanged: () => void }) {
  const [picking, setPicking] = useState(false)
  const [slots, setSlots] = useState<SuggestedSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const proposal = item.activeProposal

  async function openPicker() {
    setPicking(true); setError(null); setLoading(true)
    const durationMin = Math.max(1, Math.round((new Date(item.originalEndsAt).getTime() - new Date(item.originalStartsAt).getTime()) / 60000))
    const found = await suggestTeacherSlots(item.teacherId, durationMin)
    setSlots(found)
    setLoading(false)
  }

  async function propose(slot: SuggestedSlot) {
    setBusy(true); setError(null)
    const res = await fetch('/api/makeup/propose', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: item.lessonId, startsAt: slot.start.toISOString(), endsAt: slot.end.toISOString() }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error || t(lang, 'makeup_propose_error')); return }
    setPicking(false)
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
    if (!res.ok) { setError(data.error || t(lang, 'makeup_respond_error')); return }
    onChanged()
  }

  return (
    <div className="px-5 py-4">
      <p className="text-sm font-semibold text-gray-800">{fmtDate(item.originalStartsAt, lang)} · {item.teacherName}</p>

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

      {!proposal && !picking && (
        <button onClick={openPicker}
          className="mt-2 text-xs text-[#23479E] hover:underline font-semibold flex items-center gap-1.5">
          <Calendar size={13} />{t(lang, 'makeup_propose_time')}
        </button>
      )}

      {!proposal && picking && (
        <div className="mt-2">
          {loading && <p className="text-xs text-gray-400">{t(lang, 'finding_slots')}</p>}
          {!loading && slots.length === 0 && <p className="text-xs text-gray-400">{t(lang, 'no_slots')}</p>}
          <div className="flex flex-wrap gap-2 mt-1.5">
            {slots.map((s) => (
              <button key={s.start.toISOString()} onClick={() => propose(s)} disabled={busy}
                className="text-xs bg-[#EAF3FF] text-[#23479E] hover:bg-[#23479E] hover:text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                {fmtDateTime(s.start.toISOString(), lang)}
              </button>
            ))}
          </div>
        </div>
      )}

      {proposal && proposal.proposed_by === 'student' && (
        <div className="mt-2 flex items-center gap-3">
          <p className="text-xs text-amber-600 font-medium">{t(lang, 'makeup_awaiting_teacher')}: {fmtDateTime(proposal.proposed_starts_at, lang)}</p>
          <button onClick={() => respond('cancel')} disabled={busy} className="text-xs text-gray-400 hover:text-red-500">{t(lang, 'makeup_withdraw')}</button>
        </div>
      )}

      {proposal && proposal.proposed_by === 'teacher' && (
        <div className="mt-2">
          <p className="text-xs text-[#23479E] font-medium mb-1.5">{t(lang, 'makeup_teacher_proposes')}: {fmtDateTime(proposal.proposed_starts_at, lang)}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => respond('accept')} disabled={busy}
              className="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
              <Check size={12} />{t(lang, 'makeup_accept')}
            </button>
            <button onClick={() => respond('decline')} disabled={busy}
              className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1">
              <X size={12} />{t(lang, 'makeup_decline')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
