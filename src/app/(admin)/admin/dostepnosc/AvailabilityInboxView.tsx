'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, MapPin, Gift, CalendarClock, GraduationCap } from 'lucide-react'
import * as O from '@/lib/availability/options'

// TYMCZASOWE (nabór wrzesień 2026) — usuń razem z resztą naboru, patrz
// docs/FORMULARZ-DOSTEPNOSCI.md.

export type AvailabilityRow = {
  id: string
  created_at: string
  status: string
  parent_first_name: string
  parent_last_name: string
  email: string
  phone: string
  child_name: string
  child_age: number | null
  level: string | null
  mode: string[]
  class_format: string[]
  address: string | null
  school_name: string | null
  school_city: string | null
  availability_text: string
  notes: string | null
  preferred_teacher: string | null
  referral_code: string | null
  assigned_referral_code: string
}

const STATUS_LABEL: Record<string, string> = {
  new: 'Nowe',
  contacted: 'Po kontakcie',
  archived: 'Zarchiwizowane',
}

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-red-50 text-red-600',
  contacted: 'bg-amber-50 text-amber-600',
  archived: 'bg-gray-100 text-gray-500',
}

function waitingLabel(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (hours < 1) return 'przed chwilą'
  if (hours < 24) return `${hours} godz. temu`
  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? 'dzień' : 'dni'} temu`
}

export function AvailabilityInboxView({ rows }: { rows: AvailabilityRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p className="text-sm text-gray-400">Brak zgłoszeń.</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {rows.map((r) => <AvailabilityCard key={r.id} r={r} />)}
    </div>
  )
}

function AvailabilityCard({ r }: { r: AvailabilityRow }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function act(status: 'contacted' | 'archived') {
    setError(null)
    setBusy(true)
    const res = await fetch('/api/admin/availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, status }),
    })
    setBusy(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Nie udało się zapisać.')
      return
    }
    router.refresh()
  }

  const trybLabel = r.mode.map((v) => O.labelOf(O.modeOptions, v)).join(' oraz ')
  const formatOptions = O.formatOptionsFor(r.mode)
  const formaLabel = r.class_format.map((v) => O.labelOf(formatOptions, v)).join(' oraz ')
  const levelLabel = r.level ? O.labelOf(O.levelOptions, r.level) : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 truncate">
              {r.child_name}
              {r.child_age != null && <span className="text-gray-400 font-normal"> · {r.child_age} lat</span>}
            </h3>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${STATUS_STYLE[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {STATUS_LABEL[r.status] ?? r.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Rodzic: {r.parent_first_name} {r.parent_last_name}</p>
        </div>
        <p className="text-xs font-semibold text-gray-400 flex-shrink-0">{waitingLabel(r.created_at)}</p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
        <a href={`mailto:${r.email}`} className="flex items-center gap-1 hover:text-[#23479E]">
          <Mail size={11} />{r.email}
        </a>
        <a href={`tel:${r.phone}`} className="flex items-center gap-1 hover:text-[#23479E]">
          <Phone size={11} />{r.phone}
        </a>
        {(r.address || r.school_name) && (
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {r.address || `${r.school_name}, ${r.school_city}`}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-600 mb-2">
        <b>{trybLabel}</b> · {formaLabel}{levelLabel ? ` · poziom: ${levelLabel}` : ''}
      </p>

      <p className="flex items-start gap-1.5 text-xs text-gray-600 mb-2">
        <CalendarClock size={12} className="mt-0.5 flex-shrink-0" />
        {r.availability_text}
      </p>

      {r.preferred_teacher && (
        <p className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
          <GraduationCap size={12} className="flex-shrink-0" />
          Preferowany nauczyciel: <b>{r.preferred_teacher}</b>
        </p>
      )}

      {r.notes && <p className="text-xs text-gray-500 italic mb-2">„{r.notes}”</p>}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400 mb-3">
        <span className="flex items-center gap-1">
          <Gift size={11} />Przyznany kod: <b className="text-gray-600">{r.assigned_referral_code}</b>
        </span>
        {r.referral_code && <span>Polecił/a: {r.referral_code}</span>}
      </div>

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {r.status !== 'archived' && (
        <div className="flex gap-2">
          {r.status === 'new' && (
            <button onClick={() => act('contacted')} disabled={busy}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#23479E] text-white disabled:opacity-50">
              Skontaktowano się
            </button>
          )}
          <button onClick={() => act('archived')} disabled={busy}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 disabled:opacity-50">
            Archiwizuj
          </button>
        </div>
      )}
    </div>
  )
}
