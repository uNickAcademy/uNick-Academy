'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, TrendingUp, Wallet, Receipt, Building2, User, CreditCard, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  payment: { label: 'Wpłata', color: 'bg-green-100 text-green-700' },
  charge: { label: 'Obciążenie', color: 'bg-red-100 text-red-700' },
  credit: { label: 'Kredyt', color: 'bg-blue-100 text-blue-700' },
}

type Debtor = { id: string; name: string; owes: number }
type Tx = { id: string; student: string; type: string; amount: number; description: string; created_at: string }

export function PaymentsView({
  monthlyRevenue, totalOwed, debtors, transactions, billing, stripeReady,
}: {
  monthlyRevenue: number
  totalOwed: number
  debtors: Debtor[]
  transactions: Tx[]
  billing: { individual: number; b2b: number; vatCollected: number }
  stripeReady: boolean
}) {
  const router = useRouter()
  const [charging, setCharging] = useState(false)
  const [chargeMsg, setChargeMsg] = useState<string | null>(null)
  const [payFor, setPayFor] = useState<Debtor | null>(null)

  async function chargeMonth() {
    if (!confirm('Naliczyć miesięczny abonament aktywnym uczniom? (pominie już naliczonych w tym miesiącu)')) return
    setCharging(true); setChargeMsg(null)
    const res = await fetch('/api/admin/billing/charge-month', { method: 'POST' })
    const data = await res.json()
    setCharging(false)
    if (!res.ok) { setChargeMsg('Błąd: ' + (data.error ?? 'nie udało się')); return }
    setChargeMsg(`Naliczono ${data.charged} uczniom (${data.total} zł) za ${data.monthLabel}.${data.skipped?.length ? ' Pominięto: ' + data.skipped.join(', ') + '.' : ''}`)
    router.refresh()
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Płatności</h1>
        <button onClick={chargeMonth} disabled={charging}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
          <Receipt size={16} />{charging ? 'Naliczanie...' : 'Nalicz miesiąc'}
        </button>
      </div>

      {chargeMsg && <div className="mb-4 text-sm text-gray-700 bg-[#EAF3FF] rounded-xl px-4 py-3">{chargeMsg}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Wallet} label="Przychód (ten miesiąc)" value={`${monthlyRevenue.toLocaleString('pl-PL')} zł`} color="text-green-600" />
        <StatCard icon={AlertCircle} label="Suma zaległości" value={`${totalOwed.toLocaleString('pl-PL')} zł`} sub={`${debtors.length} studentów`} color="text-red-500" />
        <StatCard icon={TrendingUp} label="Transakcji" value={String(transactions.length)} sub="ostatnie 50" color="text-[#23479E]" />
      </div>

      {/* Analiza B2B vs indywidualni */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-gray-400"><User size={16} /></div>
          <p className="text-xs text-gray-500 mb-1">Klienci indywidualni (mies.)</p>
          <p className="text-xl font-black text-gray-900">{billing.individual.toLocaleString('pl-PL')} zł</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-gray-400"><Building2 size={16} /></div>
          <p className="text-xs text-gray-500 mb-1">B2B / firmy (mies.)</p>
          <p className="text-xl font-black text-gray-900">{billing.b2b.toLocaleString('pl-PL')} zł</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-gray-400"><Receipt size={16} /></div>
          <p className="text-xs text-gray-500 mb-1">VAT w cenach B2B (mies.)</p>
          <p className="text-xl font-black text-gray-900">{billing.vatCollected.toLocaleString('pl-PL')} zł</p>
        </div>
      </div>

      {/* Zaległości */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Raport zaległości</h2>
          {!stripeReady && <span className="text-xs text-amber-600">Stripe nieaktywny — skonfiguruj klucze, by wysyłać linki do płatności</span>}
        </div>
        {debtors.length === 0 ? (
          <p className="px-6 py-8 text-center text-gray-400 text-sm">Brak zaległości 🎉</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Zalega</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {debtors.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">{d.name}</td>
                  <td className="px-5 py-4 font-bold text-red-500">{d.owes.toLocaleString('pl-PL')} zł</td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button onClick={() => setPayFor(d)} className="text-xs text-[#23479E] hover:underline font-medium mr-3">Zarejestruj wpłatę</button>
                    <StripeLinkButton debtor={d} stripeReady={stripeReady} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Historia transakcji */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-900">Ostatnie transakcje</h2></div>
        {transactions.length === 0 ? (
          <p className="px-6 py-8 text-center text-gray-400 text-sm">Brak transakcji.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Opis</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Typ</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kwota</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t) => {
                const cfg = TYPE_MAP[t.type] ?? { label: t.type, color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">{t.student}</td>
                    <td className="px-5 py-4 text-gray-600">{t.description}</td>
                    <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span></td>
                    <td className={`px-5 py-4 font-bold ${t.type === 'charge' ? 'text-red-500' : 'text-gray-900'}`}>
                      {t.type === 'charge' ? '−' : '+'}{t.amount.toLocaleString('pl-PL')} zł
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {payFor && <PaymentModal debtor={payFor} onClose={() => setPayFor(null)} onSaved={() => { setPayFor(null); router.refresh() }} />}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: typeof Wallet; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-2 text-gray-400"><Icon size={16} /></div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function StripeLinkButton({ debtor, stripeReady }: { debtor: Debtor; stripeReady: boolean }) {
  const [loading, setLoading] = useState(false)
  async function sendLink() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: debtor.owes, studentId: debtor.id, description: `Zaległość – ${debtor.name}` }),
    })
    setLoading(false)
    const data = await res.json().catch(() => ({}))
    if (data.url) window.open(data.url, '_blank')
    else alert('Stripe nieaktywny lub błąd — skonfiguruj klucze STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET.')
  }
  return (
    <button onClick={sendLink} disabled={!stripeReady || loading}
      title={stripeReady ? 'Wygeneruj link do płatności Stripe' : 'Stripe nieaktywny — skonfiguruj klucze'}
      className="text-xs text-gray-500 hover:text-[#23479E] font-medium inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
      <CreditCard size={13} />Link do płatności
    </button>
  )
}

function PaymentModal({ debtor, onClose, onSaved }: { debtor: Debtor; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(String(debtor.owes))
  const [method, setMethod] = useState('Przelew')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    const amt = Number(amount)
    if (!amt || amt <= 0) { setError('Podaj kwotę.'); return }
    setSaving(true); setError(null)
    const supabase = createClient()
    // saldo przeliczy trigger
    const { error } = await supabase.from('transactions').insert({
      student_id: debtor.id, type: 'payment', amount: amt, description: `Wpłata (${method})`,
    })
    setSaving(false)
    if (error) { setError('Nie udało się zapisać: ' + error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Zarejestruj wpłatę</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{debtor.name} · zalega {debtor.owes} zł</p>
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
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            <Check size={16} />{saving ? 'Zapis...' : 'Zapisz wpłatę'}
          </button>
        </div>
      </div>
    </div>
  )
}
