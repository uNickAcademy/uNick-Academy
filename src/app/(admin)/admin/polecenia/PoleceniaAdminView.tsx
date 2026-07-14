'use client'

import { useMemo, useState, useTransition } from 'react'
import { Plus, Gift, Search, Loader2 } from 'lucide-react'
import { adjustCredit } from './actions'

type Referrer = { studentId: string; name: string; code: string; uses: number; credit: number; referred: { name: string; date: string }[] }
type StudentRow = { id: string; name: string; code: string; balance: number }

export function PoleceniaAdminView({ referrers, students }: { referrers: Referrer[]; students: StudentRow[] }) {
  const [search, setSearch] = useState('')
  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustDesc, setAdjustDesc] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students.slice(0, 15)
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)).slice(0, 25)
  }, [search, students])

  const applyAdjust = (studentId: string) => {
    const amount = Number(adjustAmount)
    if (!amount || Number.isNaN(amount)) return
    startTransition(async () => {
      const res = await adjustCredit(studentId, amount, adjustDesc || 'Korekta kredytu (admin)')
      setMessage(res.error ?? 'Zapisano korektę')
      setAdjustId(null)
      setAdjustAmount('')
      setAdjustDesc('')
      setTimeout(() => setMessage(null), 4000)
    })
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Polecenia</h1>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-[#EAF3FF] text-[#23479E] text-sm font-medium">{message}</div>
      )}

      {/* Aktywni polecający */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Aktywni polecający ({referrers.length})</h2>
      {referrers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm mb-8">
          Nikt jeszcze nie skorzystał z kodu polecenia. Kody uczniów znajdziesz poniżej.
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {referrers.map((ref) => (
            <div key={ref.studentId} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl font-black font-mono text-[#23479E] tracking-widest">{ref.code}</span>
                    <span className="text-sm bg-[#EAF3FF] text-[#23479E] px-2.5 py-0.5 rounded-full font-semibold">
                      {ref.uses} {ref.uses === 1 ? 'użycie' : 'użycia'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Właściciel: <strong className="text-gray-700">{ref.name}</strong></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">Zarobiony kredyt</p>
                  <p className="text-2xl font-black text-[#23479E]">{ref.credit} zł</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Polecone osoby</p>
              <div className="space-y-1.5">
                {ref.referred.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Gift size={12} className="text-violet-400" />
                    {r.name} – {new Date(r.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wszyscy uczniowie – kody + korekta kredytu */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Kody i salda uczniów</h2>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Search size={16} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po imieniu lub kodzie..."
            className="flex-1 text-sm focus:outline-none"
          />
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.map((s) => (
            <div key={s.id} className="px-6 py-3">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs font-mono text-gray-400">{s.code}</p>
                </div>
                <span className={`text-sm font-bold ${s.balance < 0 ? 'text-red-500' : s.balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {s.balance > 0 ? '+' : ''}{Math.round(s.balance)} zł
                </span>
                <button
                  onClick={() => { setAdjustId(adjustId === s.id ? null : s.id); setAdjustAmount(''); setAdjustDesc('') }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#23479E] transition-colors font-medium flex-shrink-0"
                >
                  <Plus size={12} />
                  Korekta
                </button>
              </div>
              {adjustId === s.id && (
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="Kwota (np. 50 lub -50)"
                    className="w-40 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]"
                  />
                  <input
                    value={adjustDesc}
                    onChange={(e) => setAdjustDesc(e.target.value)}
                    placeholder="Opis (opc.)"
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]"
                  />
                  <button
                    disabled={pending}
                    className="px-4 py-2 rounded-xl bg-[#23479E] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                    onClick={() => applyAdjust(s.id)}
                  >
                    {pending && <Loader2 size={12} className="animate-spin" />}
                    Zastosuj
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    onClick={() => setAdjustId(null)}
                  >
                    Anuluj
                  </button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Brak wyników</p>
          )}
        </div>
      </div>
    </div>
  )
}
