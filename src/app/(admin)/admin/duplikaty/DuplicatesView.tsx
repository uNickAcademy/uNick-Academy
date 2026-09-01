'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, Merge, ShieldCheck, Info, X, Check, AlertTriangle } from 'lucide-react'
import type { DuplicateGroup, DuplicateCandidate, Confidence } from '@/lib/students/identity'

const CONFIDENCE: Record<Confidence, { label: string; style: string }> = {
  pewny: { label: 'Na pewno duplikat', style: 'bg-red-100 text-red-700' },
  prawdopodobny: { label: 'Prawdopodobny', style: 'bg-amber-100 text-amber-700' },
  mozliwy: { label: 'Do sprawdzenia', style: 'bg-gray-100 text-gray-600' },
}

const STATUS_LABEL: Record<string, string> = {
  active: 'aktywny', trial: 'próbny', overdue: 'zaległość', paused: 'wstrzymany',
}

const day = (iso: string) => new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })

export function DuplicatesView({ groups }: { groups: DuplicateGroup[] }) {
  const router = useRouter()
  const [merging, setMerging] = useState<DuplicateGroup | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Duplikaty kartotek</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Ta sama osoba w dwóch kartotekach rozbija jej historię lekcji i płatności. Połączenie przenosi wszystko
        pod jedno konto — nic nie jest kasowane.
      </p>

      {msg && (
        <div className="mb-4 text-sm text-gray-700 bg-[#EAF3FF] rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={16} className="mt-0.5 flex-shrink-0 text-[#23479E]" />
          <span className="flex-1">{msg}</span>
          <button onClick={() => setMsg(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-sm text-gray-600 flex items-start gap-3">
        <ShieldCheck size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
        <p>
          Nowe duplikaty nie powstaną: baza dopasowuje ucznia po nazwie odpornej na kolejność słów, wielkość liter,
          polskie znaki i interpunkcję (&bdquo;Bartl Klara&rdquo; = &bdquo;Klara Bartl&rdquo;), a indeks unikalny nie dopuści drugiej
          kartoteki tej samej osoby na jednym koncie. Rodzeństwo pod kontem rodzica działa bez zmian — ma inne imiona.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-12 text-center">
          <p className="text-gray-900 font-semibold mb-1">Brak duplikatów 🎉</p>
          <p className="text-sm text-gray-400">Każdy uczeń ma dokładnie jedną kartotekę.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.key} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                <Copy size={16} className="text-gray-400" />
                <span className="font-bold text-gray-900">{g.members[0].name}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${CONFIDENCE[g.confidence].style}`}>
                  {CONFIDENCE[g.confidence].label}
                </span>
                <span className="text-xs text-gray-400">{g.members.length} kartoteki</span>
                <button onClick={() => setMerging(g)}
                  className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90">
                  <Merge size={15} />Połącz
                </button>
              </div>
              <p className="px-5 pt-3 text-xs text-gray-500">{g.reason}</p>
              <div className="p-5 pt-3 grid gap-3 sm:grid-cols-2">
                {g.members.map((m) => (
                  <MemberCard key={m.id} member={m} suggested={m.id === g.suggestedKeepId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {merging && (
        <MergeModal group={merging} onClose={() => setMerging(null)}
          onDone={(kept, count) => {
            setMerging(null)
            setMsg(`Połączono ${count + 1} kartoteki w jedną — została „${kept}". Historia lekcji i płatności jest teraz w jednym miejscu.`)
            router.refresh()
          }} />
      )}
    </div>
  )
}

function MemberCard({ member, suggested }: { member: DuplicateCandidate; suggested: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${suggested ? 'border-[#23479E] bg-[#F5F8FF]' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <Link href={`/admin/studenci/${member.id}`} className="font-semibold text-gray-900 hover:text-[#23479E]">
          {member.name}
        </Link>
        {suggested && <span className="text-[11px] font-bold text-[#23479E] whitespace-nowrap">zostaje</span>}
      </div>
      <p className="text-xs text-gray-400 mb-2">{member.email ?? member.phone ?? '—'}</p>
      <div className="text-xs text-gray-600 space-y-0.5">
        <p>{member.lessons} lekcji · {member.groups} grup · {member.transactions} transakcji</p>
        <p>saldo {Math.round(member.balance).toLocaleString('pl-PL')} zł · {STATUS_LABEL[member.status] ?? member.status}</p>
        <p className="text-gray-400">dołączył/a {day(member.joinedAt)}</p>
      </div>
    </div>
  )
}

function MergeModal({ group, onClose, onDone }: {
  group: DuplicateGroup
  onClose: () => void
  onDone: (keptName: string, mergedCount: number) => void
}) {
  const [keepId, setKeepId] = useState(group.suggestedKeepId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const keep = group.members.find((m) => m.id === keepId)!
  const merged = group.members.filter((m) => m.id !== keepId)
  const totalLessons = group.members.reduce((a, m) => a + m.lessons, 0)

  async function run() {
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/students/merge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepId, mergeIds: merged.map((m) => m.id) }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Nie udało się połączyć kartotek.'); return }
    onDone(keep.name, merged.length)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900">Połącz kartoteki</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <p className="text-xs text-gray-500 mb-3">Wybierz kartotekę, która ma zostać — reszta trafi do niej i wyląduje w poczekalni.</p>

        <div className="space-y-2 mb-4">
          {group.members.map((m) => (
            <label key={m.id}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${
                keepId === m.id ? 'border-[#23479E] bg-[#F5F8FF]' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="radio" name="keep" checked={keepId === m.id} onChange={() => setKeepId(m.id)} className="mt-1" />
              <span className="text-sm">
                <span className="font-semibold text-gray-900">{m.name}</span>
                <span className="block text-xs text-gray-500">
                  {m.lessons} lekcji · {m.groups} grup · {m.transactions} transakcji · od {day(m.joinedAt)}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 mb-4">
          <p className="flex items-center gap-1.5 font-semibold text-gray-700 mb-1">
            <AlertTriangle size={13} className="text-amber-500" />Po połączeniu
          </p>
          <p>
            Kartoteka <strong>{keep.name}</strong> przejmie całą historię — łącznie {totalLessons} lekcji.
            {merged.length === 1 ? ' Druga kartoteka trafi' : ` Pozostałe ${merged.length} kartoteki trafią`} do poczekalni,
            skąd można je przywrócić.
          </p>
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={run} disabled={saving}
            className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            <Check size={16} />{saving ? 'Łączenie...' : 'Połącz'}
          </button>
        </div>
      </div>
    </div>
  )
}
