'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail, Phone, Clock, MapPin, Monitor, Users, MessageSquare, Check, X, PhoneCall,
} from 'lucide-react'
import type { InboxLead } from '@/lib/supabase/queries'

// Skąd przyszło zgłoszenie — po ludzku, nie kluczem z bazy.
const ENTRY_LABEL: Record<string, string> = {
  zapisy_wizard: 'Kreator zapisów',
  advice: 'Nie wie, czego szuka',
  consultation_modal: 'Modal konsultacji',
  contact_form: 'Formularz kontaktowy',
  group_list_button: 'Przycisk przy grupie',
}

const STATUS_LABEL: Record<string, string> = {
  new: 'Nowe',
  contacted: 'Po kontakcie',
  qualified: 'Zakwalifikowane',
  booked: 'Zarezerwowane',
}

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-red-50 text-red-600',
  contacted: 'bg-amber-50 text-amber-600',
  qualified: 'bg-blue-50 text-blue-600',
  booked: 'bg-green-50 text-green-600',
}

const TYPE_LABEL: Record<string, string> = {
  child: 'dziecko', teen: 'nastolatek', adult: 'dorosły', corporate: 'firma',
}

// Dni robocze między dwiema datami — obietnica brzmi „do 2 dni roboczych",
// więc weekend nie może podbijać licznika opóźnienia.
function businessDaysSince(iso: string): number {
  const from = new Date(iso)
  const to = new Date()
  let days = 0
  const cur = new Date(from)
  cur.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
  while (cur < end) {
    cur.setDate(cur.getDate() + 1)
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) days++
  }
  return days
}

function waitingLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(ms / 3_600_000)
  if (hours < 1) return 'przed chwilą'
  if (hours < 24) return `${hours} godz. temu`
  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? 'dzień' : 'dni'} temu`
}

export function InboxView({ rows }: { rows: InboxLead[] }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <p className="text-sm text-gray-400">Skrzynka pusta — wszystkie zgłoszenia obsłużone.</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {rows.map((r) => <InboxCard key={r.id} r={r} />)}
    </div>
  )
}

function InboxCard({ r }: { r: InboxLead }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Licznik dotyczy wyłącznie pierwszej odpowiedzi — po kontakcie przestaje
  // mieć znaczenie, bo obietnica została dotrzymana.
  const awaitingFirstReply = !r.firstResponseAt && r.status === 'new'
  const overdue = awaitingFirstReply && businessDaysSince(r.createdAt) >= 2

  async function act(status: 'contacted' | 'qualified' | 'won' | 'lost') {
    if (status === 'lost' && !confirm(`Oznaczyć zgłoszenie od ${r.firstName ?? 'tej osoby'} jako niedoszłe do skutku?`)) return
    setError(null)
    setBusy(true)
    const res = await fetch('/api/admin/leads', {
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

  return (
    <div className={`bg-white rounded-2xl border p-5 ${overdue ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 truncate">
              {r.firstName ?? 'Bez imienia'}
              {r.studentAge != null && <span className="text-gray-400 font-normal"> · {r.studentAge} lat</span>}
            </h3>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${STATUS_STYLE[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {STATUS_LABEL[r.status] ?? r.status}
            </span>
            {r.studentType && (
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">{TYPE_LABEL[r.studentType] ?? r.studentType}</span>
            )}
          </div>
          {r.parentName && <p className="text-xs text-gray-400 mt-0.5">Rodzic: {r.parentName}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-xs font-semibold ${overdue ? 'text-red-500' : 'text-gray-400'}`}>{waitingLabel(r.createdAt)}</p>
          {overdue && <p className="text-[11px] text-red-500 font-bold">po terminie</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
        {r.email && (
          <a href={`mailto:${r.email}`} className="flex items-center gap-1 hover:text-[#23479E]">
            <Mail size={11} />{r.email}
          </a>
        )}
        {r.phone && (
          <a href={`tel:${r.phone}`} className="flex items-center gap-1 hover:text-[#23479E]">
            <Phone size={11} />{r.phone}
          </a>
        )}
        {r.location && (
          <span className="flex items-center gap-1">
            {r.location === 'online' ? <Monitor size={11} /> : <MapPin size={11} />}
            {r.location === 'online' ? 'Online' : r.location === 'rumianek' ? 'Rumianek' : 'Obojętnie'}
          </span>
        )}
        <span className="flex items-center gap-1 text-gray-400">
          <MessageSquare size={11} />{ENTRY_LABEL[r.entryPoint ?? ''] ?? r.entryPoint ?? 'nieznane źródło'}
        </span>
      </div>

      {r.groupName && (
        <p className="text-sm text-gray-700 flex items-center gap-1.5 mb-2">
          <Users size={13} className="text-[#23479E]" />
          <span className="font-semibold">{r.groupName}</span>
        </p>
      )}
      {r.goal && <p className="text-sm text-gray-600 leading-relaxed mb-2">{r.goal}</p>}
      {r.preferredStart && (
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
          <Clock size={11} />Preferowane pory: {r.preferredStart}
        </p>
      )}
      {r.campaign && <p className="text-[11px] text-gray-400 mb-2">Kampania: {r.campaign}</p>}

      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
        {r.status === 'new' && (
          <button onClick={() => act('contacted')} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#23479E] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50">
            <PhoneCall size={13} />Skontaktowano się
          </button>
        )}
        {(r.status === 'new' || r.status === 'contacted') && (
          <button onClick={() => act('qualified')} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50">
            <Check size={13} />Zakwalifikowane
          </button>
        )}
        {r.status === 'booked' && (
          <button onClick={() => act('won')} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-50">
            <Check size={13} />Uczeń zapisany — zamknij
          </button>
        )}
        {r.status !== 'booked' && (
          <button onClick={() => act('lost')} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 disabled:opacity-50">
            <X size={13} />Nie doszło do skutku
          </button>
        )}
      </div>
    </div>
  )
}
