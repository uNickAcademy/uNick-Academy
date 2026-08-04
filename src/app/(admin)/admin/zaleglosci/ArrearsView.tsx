'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, Search, Download, Undo2, Check, X, Wallet, PauseCircle,
  CalendarX, Copy, Building2, Info,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ArrearsReport, ArrearsRow } from '@/lib/supabase/queries'

const STATUS_LABEL: Record<string, string> = {
  active: 'aktywny',
  trial: 'próbny',
  overdue: 'zaległość',
  paused: 'wstrzymany',
}
const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trial: 'bg-blue-100 text-blue-700',
  overdue: 'bg-red-100 text-red-700',
  paused: 'bg-gray-100 text-gray-500',
}

type Segment = 'all' | 'collectible' | 'paused' | 'noLessons' | 'duplicates' | 'b2b'

const SEGMENTS: { key: Segment; label: string; match: (r: ArrearsRow) => boolean }[] = [
  { key: 'all', label: 'Wszyscy', match: () => true },
  { key: 'collectible', label: 'Do odzyskania', match: (r) => r.status !== 'paused' },
  { key: 'paused', label: 'Wstrzymani', match: (r) => r.status === 'paused' },
  { key: 'noLessons', label: 'Bez ani jednej lekcji', match: (r) => r.lessonsHeld === 0 && r.lessonsPlanned === 0 },
  { key: 'duplicates', label: 'Zdublowane kartoteki', match: (r) => r.isDuplicate },
  { key: 'b2b', label: 'B2B / firmowi', match: (r) => r.billingType === 'b2b' },
]

type SortKey = 'owes' | 'name' | 'lastLesson' | 'joined'

const zl = (n: number) => `${Math.round(n).toLocaleString('pl-PL')} zł`
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export function ArrearsView({ report }: { report: ArrearsReport }) {
  const router = useRouter()
  const { rows, totals, biggestChargeBatch } = report

  const [segment, setSegment] = useState<Segment>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('owes')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [payFor, setPayFor] = useState<ArrearsRow | null>(null)
  const [stornoFor, setStornoFor] = useState<ArrearsRow[] | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const visible = useMemo(() => {
    const seg = SEGMENTS.find((s) => s.key === segment)!
    const q = query.trim().toLowerCase()
    const filtered = rows.filter((r) => {
      if (!seg.match(r)) return false
      if (!q) return true
      return [r.name, r.email, r.phone, r.companyName].some((v) => v?.toLowerCase().includes(q))
    })
    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sort === 'owes') return b.owes - a.owes
      if (sort === 'name') return a.name.localeCompare(b.name, 'pl')
      if (sort === 'joined') return b.joinedAt.localeCompare(a.joinedAt)
      // ostatnia lekcja: najdawniejsi (i ci bez lekcji) na górze
      return (a.lastLessonAt ?? '').localeCompare(b.lastLessonAt ?? '')
    })
    return sorted
  }, [rows, segment, query, sort])

  const visibleSum = visible.reduce((a, r) => a + r.owes, 0)
  const selectedRows = visible.filter((r) => selected.has(r.id))
  const selectedSum = selectedRows.reduce((a, r) => a + r.owes, 0)
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) visible.forEach((r) => next.delete(r.id))
      else visible.forEach((r) => next.add(r.id))
      return next
    })
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exportCsv() {
    const head = ['Student', 'E-mail', 'Telefon', 'Status', 'Rozliczenie', 'Firma', 'Zalega (zł)', 'Obciążenia (zł)', 'Wpłaty (zł)',
      'Ostatnie obciążenie', 'Data obciążenia', 'Ostatnia wpłata', 'Lekcje odbyte', 'Lekcje zaplanowane', 'Ostatnia lekcja', 'Dołączył', 'Opiekun', 'Duplikat']
    const esc = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = visible.map((r) => [
      r.name, r.email, r.phone, STATUS_LABEL[r.status] ?? r.status, r.billingType === 'b2b' ? 'B2B' : 'indywidualne', r.companyName,
      r.owes, r.charged, r.paid, r.lastCharge?.description ?? '', r.lastCharge ? day(r.lastCharge.at) : '',
      day(r.lastPaymentAt), r.lessonsHeld, r.lessonsPlanned, day(r.lastLessonAt), day(r.joinedAt), r.teacherName,
      r.isDuplicate ? 'tak' : 'nie',
    ].map(esc).join(';'))
    const csv = '﻿' + [head.map(esc).join(';'), ...lines].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `zaleglosci-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-black text-gray-900">Zaległości</h1>
        <button onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <Download size={16} />Eksport CSV
        </button>
      </div>
      <p className="text-gray-500 mb-6 text-sm">
        Pełna lista sald ujemnych wraz z historią obciążeń i frekwencją — żeby było widać, skąd wziął się każdy dług.
      </p>

      {msg && (
        <div className="mb-4 text-sm text-gray-700 bg-[#EAF3FF] rounded-xl px-4 py-3 flex items-start gap-2">
          <Info size={16} className="mt-0.5 flex-shrink-0 text-[#23479E]" />
          <span className="flex-1">{msg}</span>
          <button onClick={() => setMsg(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Tile icon={Wallet} color="text-red-500" label="Do odzyskania" value={zl(totals.collectible.amount)}
          sub={`${totals.collectible.count} ${plural(totals.collectible.count)} · status inny niż wstrzymany`} />
        <Tile icon={PauseCircle} color="text-gray-500" label="Wstrzymani" value={zl(totals.paused.amount)}
          sub={`${totals.paused.count} ${plural(totals.paused.count)} nie chodzi na zajęcia`} />
        <Tile icon={CalendarX} color="text-amber-600" label="Bez ani jednej lekcji" value={zl(totals.noLessons.amount)}
          sub={`${totals.noLessons.count} ${plural(totals.noLessons.count)} · prawdopodobnie naliczone omyłkowo`} />
        <Tile icon={AlertTriangle} color="text-gray-900" label="Razem w bazie" value={zl(totals.all.amount)}
          sub={`${totals.all.count} ${plural(totals.all.count)} z ujemnym saldem`} />
      </div>

      {biggestChargeBatch && biggestChargeBatch.count > 1 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-bold flex items-center gap-2 mb-1"><AlertTriangle size={16} />Skąd bierze się ta kwota</p>
          <p>
            Największa paczka obciążeń to <strong>„{biggestChargeBatch.description}"</strong> z {day(biggestChargeBatch.at)} —{' '}
            {biggestChargeBatch.count} obciążeń na {zl(biggestChargeBatch.amount)}. Naliczenie obejmuje wszystkich, którzy w tamtym
            momencie mieli status aktywny lub próbny, więc trafiają do niego również osoby, które nigdy nie zaczęły zajęć albo
            zostały później wstrzymane.
            {totals.noLessons.count > 0 && (
              <> Dziś <strong>{totals.noLessons.count}</strong> z {totals.all.count} dłużników nie ma w systemie ani jednej lekcji
              ({zl(totals.noLessons.amount)}) — te obciążenia najpewniej trzeba wystornować.</>
            )}
            {totals.duplicates.count > 0 && (
              <> Dodatkowo {totals.duplicates.count} pozycji to zdublowane kartoteki tej samej osoby.</>
            )}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {SEGMENTS.map((s) => {
          const matching = rows.filter(s.match)
          return (
            <button key={s.key} onClick={() => setSegment(s.key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                segment === s.key ? 'bg-[#23479E] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s.label} <span className={segment === s.key ? 'text-white/70' : 'text-gray-400'}>({matching.length})</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szukaj po nazwisku, mailu, telefonie, firmie…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
          <option value="owes">Sortuj: kwota długu</option>
          <option value="name">Sortuj: nazwisko</option>
          <option value="lastLesson">Sortuj: najdawniejsza lekcja</option>
          <option value="joined">Sortuj: data dołączenia</option>
        </select>
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {visible.length} {plural(visible.length)} · <strong className="text-gray-900">{zl(visibleSum)}</strong>
        </span>
      </div>

      {selectedRows.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-gray-900 text-white px-5 py-3 text-sm">
          <span className="font-semibold">Zaznaczono {selectedRows.length} — {zl(selectedSum)}</span>
          <button onClick={() => setStornoFor(selectedRows)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-gray-900 font-semibold hover:opacity-90">
            <Undo2 size={15} />Wystornuj obciążenia
          </button>
          <button onClick={() => setSelected(new Set())} className="text-gray-300 hover:text-white">Wyczyść</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        {visible.length === 0 ? (
          <p className="px-6 py-12 text-center text-gray-400 text-sm">Brak zaległości w tym widoku 🎉</p>
        ) : (
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Zaznacz wszystkich" />
                </th>
                <th className="text-left px-4 py-3">Student</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Zalega</th>
                <th className="text-left px-4 py-3">Ostatnie obciążenie</th>
                <th className="text-left px-4 py-3">Ostatnia wpłata</th>
                <th className="text-left px-4 py-3">Lekcje</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} aria-label={`Zaznacz ${r.name}`} />
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/studenci/${r.id}`} className="font-semibold text-gray-900 hover:text-[#23479E]">{r.name}</Link>
                    <div className="text-xs text-gray-400">{r.email ?? r.phone ?? '—'}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.lessonsHeld === 0 && r.lessonsPlanned === 0 && (
                        <Badge className="bg-amber-100 text-amber-700"><CalendarX size={11} />bez lekcji</Badge>
                      )}
                      {r.isDuplicate && <Badge className="bg-purple-100 text-purple-700"><Copy size={11} />duplikat</Badge>}
                      {r.billingType === 'b2b' && (
                        <Badge className="bg-blue-100 text-blue-700"><Building2 size={11} />{r.companyName ?? 'B2B'}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">od {day(r.joinedAt)}</div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="font-bold text-red-500">{zl(r.owes)}</div>
                    <div className="text-xs text-gray-400">obciążeń {zl(r.charged)} · wpłat {zl(r.paid)}</div>
                  </td>
                  <td className="px-4 py-4">
                    {r.lastCharge ? (
                      <>
                        <div className="text-gray-700">{r.lastCharge.description}</div>
                        <div className="text-xs text-gray-400">{day(r.lastCharge.at)} · {zl(r.lastCharge.amount)}</div>
                      </>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {r.lastPaymentAt ? day(r.lastPaymentAt) : <span className="text-red-400">nigdy</span>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-gray-700">{r.lessonsHeld} odbytych</div>
                    <div className="text-xs text-gray-400">
                      {r.lessonsPlanned > 0 ? `${r.lessonsPlanned} zaplanowanych · ` : ''}ostatnia {day(r.lastLessonAt)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <button onClick={() => setPayFor(r)} className="text-xs text-[#23479E] hover:underline font-medium mr-3">Wpłata</button>
                    <button onClick={() => setStornoFor([r])} className="text-xs text-gray-500 hover:text-red-500 font-medium">Storno</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {payFor && (
        <PaymentModal row={payFor} onClose={() => setPayFor(null)}
          onSaved={(amount) => { setPayFor(null); setMsg(`Zapisano wpłatę ${zl(amount)} — ${payFor.name}.`); router.refresh() }} />
      )}
      {stornoFor && (
        <StornoModal rows={stornoFor} onClose={() => setStornoFor(null)}
          onDone={(count, amount) => {
            setStornoFor(null); setSelected(new Set())
            setMsg(`Wystornowano ${count} ${plural(count)} na łączną kwotę ${zl(amount)}.`)
            router.refresh()
          }} />
      )}
    </div>
  )
}

function plural(n: number) {
  if (n === 1) return 'studenta'
  return 'studentów'
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${className}`}>{children}</span>
}

function Tile({ icon: Icon, label, value, sub, color }: {
  icon: typeof Wallet; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className={`mb-2 ${color}`}><Icon size={18} /></div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function PaymentModal({ row, onClose, onSaved }: { row: ArrearsRow; onClose: () => void; onSaved: (amount: number) => void }) {
  const [amount, setAmount] = useState(String(row.owes))
  const [method, setMethod] = useState('Przelew')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    const amt = Number(amount)
    if (!amt || amt <= 0) { setError('Podaj kwotę.'); return }
    setSaving(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('transactions').insert({
      student_id: row.id, type: 'payment', amount: amt, description: `Wpłata (${method})`,
    })
    setSaving(false)
    if (error) { setError('Nie udało się zapisać: ' + error.message); return }
    onSaved(amt)
  }

  return (
    <Modal title="Zarejestruj wpłatę" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-4">{row.name} · zalega {zl(row.owes)}</p>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Kwota (zł)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Metoda</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
            <option>Przelew</option><option>Gotówka</option><option>BLIK</option><option>Karta</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      <div className="flex gap-2 mt-6">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
        <button onClick={save} disabled={saving}
          className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
          <Check size={16} />{saving ? 'Zapis...' : 'Zapisz wpłatę'}
        </button>
      </div>
    </Modal>
  )
}

// Storno = korekta błędnego obciążenia. Nie kasujemy historii — dopisujemy
// transakcję typu „credit", która zeruje saldo i zostaje w rejestrze.
function StornoModal({ rows, onClose, onDone }: {
  rows: ArrearsRow[]; onClose: () => void; onDone: (count: number, amount: number) => void
}) {
  const [reason, setReason] = useState('Korekta błędnego naliczenia')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const total = rows.reduce((a, r) => a + r.owes, 0)

  async function run() {
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/billing/storno', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentIds: rows.map((r) => r.id), reason }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Nie udało się wystornować.'); return }
    onDone(data.count ?? rows.length, data.amount ?? total)
  }

  return (
    <Modal title="Wystornuj obciążenia" onClose={onClose}>
      <p className="text-sm text-gray-500 mb-1">
        {rows.length === 1 ? rows[0].name : `${rows.length} studentów`} · łącznie {zl(total)}
      </p>
      <p className="text-xs text-gray-400 mb-4">
        Saldo zostanie wyzerowane transakcją korygującą. Historia obciążeń zostaje w systemie — nic nie znika.
      </p>
      {rows.length > 1 && (
        <div className="max-h-32 overflow-y-auto rounded-xl bg-gray-50 p-3 mb-4 text-xs text-gray-600 space-y-1">
          {rows.map((r) => <div key={r.id} className="flex justify-between gap-3"><span>{r.name}</span><span>{zl(r.owes)}</span></div>)}
        </div>
      )}
      <label className="block text-xs font-medium text-gray-600 mb-1">Powód korekty</label>
      <input value={reason} onChange={(e) => setReason(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      <div className="flex gap-2 mt-6">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
        <button onClick={run} disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
          <Undo2 size={16} />{saving ? 'Storno...' : 'Wystornuj'}
        </button>
      </div>
    </Modal>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
