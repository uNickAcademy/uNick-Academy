'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Trash2, Calculator, Tag, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const WEEKS_PER_MONTH = 4.33

type Plan = { id: string; name: string; lessonsPerWeek: number; pricePerLesson: number; isActive: boolean }
type Code = {
  id: string; code: string; percentOff: number | null; amountOff: number | null
  description: string; validUntil: string; maxUses: number | null; timesUsed: number; isActive: boolean
}

export function PricingView({ plans, codes }: { plans: Plan[]; codes: Code[] }) {
  const router = useRouter()
  const [editingPlan, setEditingPlan] = useState<Plan | 'new' | null>(null)
  const [addingCode, setAddingCode] = useState(false)

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-black text-gray-900">Cennik</h1>

      {/* Kalkulator */}
      <Calculator2 plans={plans} codes={codes} />

      {/* Plany cenowe */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Tag size={18} />Plany cenowe</h2>
          <button onClick={() => setEditingPlan('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus size={16} /> Nowy plan
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((p) => {
            const monthly = Math.round(p.pricePerLesson * p.lessonsPerWeek * WEEKS_PER_MONTH)
            return (
              <button key={p.id} onClick={() => setEditingPlan(p)}
                className="bg-white rounded-2xl p-5 border border-gray-100 text-left hover:border-[#23479E] transition-colors">
                <p className="font-bold text-gray-900">{p.name}</p>
                <p className="text-2xl font-black text-[#23479E] mt-2">{p.pricePerLesson} zł<span className="text-sm font-medium text-gray-400">/lekcja</span></p>
                <p className="text-xs text-gray-500 mt-1">≈ {monthly} zł / miesiąc ({p.lessonsPerWeek}×/tydz.)</p>
                {!p.isActive && <span className="inline-block mt-2 text-xs text-gray-400">nieaktywny</span>}
              </button>
            )
          })}
        </div>
      </section>

      {/* Kody rabatowe */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Kody rabatowe</h2>
          <button onClick={() => setAddingCode(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Plus size={16} /> Nowy kod
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {codes.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">Brak kodów rabatowych.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Kod</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Rabat</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Ważny do</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Użycia</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {codes.map((c) => <CodeRow key={c.id} c={c} onChanged={() => router.refresh()} />)}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {editingPlan && (
        <PlanModal plan={editingPlan === 'new' ? null : editingPlan}
          onClose={() => setEditingPlan(null)} onSaved={() => { setEditingPlan(null); router.refresh() }} />
      )}
      {addingCode && (
        <CodeModal onClose={() => setAddingCode(false)} onSaved={() => { setAddingCode(false); router.refresh() }} />
      )}
    </div>
  )
}

function discountLabel(c: Code) {
  if (c.percentOff != null) return `${c.percentOff}%`
  if (c.amountOff != null) return `${c.amountOff} zł`
  return '—'
}

function CodeRow({ c, onChanged }: { c: Code; onChanged: () => void }) {
  async function toggle() {
    const supabase = createClient()
    await supabase.from('discount_codes').update({ is_active: !c.isActive }).eq('id', c.id)
    onChanged()
  }
  async function remove() {
    if (!confirm(`Usunąć kod ${c.code}?`)) return
    const supabase = createClient()
    await supabase.from('discount_codes').delete().eq('id', c.id)
    onChanged()
  }
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-5 py-3 font-mono font-bold text-gray-900">{c.code}</td>
      <td className="px-5 py-3 text-gray-700">{discountLabel(c)}</td>
      <td className="px-5 py-3 text-gray-500 text-xs">{c.validUntil ? new Date(c.validUntil).toLocaleDateString('pl-PL') : 'bezterminowo'}</td>
      <td className="px-5 py-3 text-gray-500 text-xs">{c.timesUsed}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
      <td className="px-5 py-3">
        <button onClick={toggle} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {c.isActive ? 'Aktywny' : 'Nieaktywny'}
        </button>
      </td>
      <td className="px-5 py-3 text-right">
        <button onClick={remove} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
      </td>
    </tr>
  )
}

function Calculator2({ plans, codes }: { plans: Plan[]; codes: Code[] }) {
  const [lessonsPerWeek, setLessonsPerWeek] = useState(1)
  const [pricePerLesson, setPricePerLesson] = useState(plans[0]?.pricePerLesson ?? 80)
  const [codeId, setCodeId] = useState('')

  const result = useMemo(() => {
    const base = pricePerLesson * lessonsPerWeek * WEEKS_PER_MONTH
    const code = codes.find((c) => c.id === codeId)
    let discount = 0
    if (code) {
      if (code.percentOff != null) discount = base * (code.percentOff / 100)
      else if (code.amountOff != null) discount = code.amountOff
    }
    const finalPrice = Math.max(0, base - discount)
    return { base: Math.round(base), discount: Math.round(discount), finalPrice: Math.round(finalPrice) }
  }, [lessonsPerWeek, pricePerLesson, codeId, codes])

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Calculator size={18} />Kalkulator ceny miesięcznej</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Lekcji w tygodniu</label>
          <input type="number" min={1} max={7} value={lessonsPerWeek} onChange={(e) => setLessonsPerWeek(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Cena za lekcję (zł)</label>
          <input type="number" min={0} value={pricePerLesson} onChange={(e) => setPricePerLesson(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Kod rabatowy</label>
          <select value={codeId} onChange={(e) => setCodeId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
            <option value="">— brak —</option>
            {codes.filter((c) => c.isActive).map((c) => <option key={c.id} value={c.id}>{c.code} ({discountLabel(c)})</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-6 bg-[#EAF3FF] rounded-xl px-5 py-4">
        <div>
          <p className="text-xs text-gray-500">Cena bazowa / mies.</p>
          <p className="text-lg font-bold text-gray-700">{result.base} zł</p>
        </div>
        {result.discount > 0 && (
          <div>
            <p className="text-xs text-gray-500">Rabat</p>
            <p className="text-lg font-bold text-red-500">− {result.discount} zł</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500">Do zapłaty / mies.</p>
          <p className="text-2xl font-black text-[#23479E]">{result.finalPrice} zł</p>
        </div>
        <p className="text-xs text-gray-400 ml-auto">≈ {WEEKS_PER_MONTH} tyg./mies.</p>
      </div>
    </section>
  )
}

function PlanModal({ plan, onClose, onSaved }: { plan: Plan | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(plan?.name ?? '')
  const [lessonsPerWeek, setLessonsPerWeek] = useState(plan?.lessonsPerWeek ?? 1)
  const [pricePerLesson, setPricePerLesson] = useState(plan?.pricePerLesson ?? 80)
  const [isActive, setIsActive] = useState(plan?.isActive ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!name.trim()) { setError('Podaj nazwę.'); return }
    setSaving(true); setError(null)
    const supabase = createClient()
    const payload = { name: name.trim(), lessons_per_week: lessonsPerWeek, price_per_lesson: pricePerLesson, is_active: isActive }
    const { error } = plan
      ? await supabase.from('pricing_plans').update(payload).eq('id', plan.id)
      : await supabase.from('pricing_plans').insert(payload)
    setSaving(false)
    if (error) { setError('Nie udało się zapisać: ' + error.message); return }
    onSaved()
  }

  async function remove() {
    if (!plan || !confirm('Usunąć plan?')) return
    const supabase = createClient()
    await supabase.from('pricing_plans').delete().eq('id', plan.id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">{plan ? 'Edytuj plan' : 'Nowy plan'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nazwa</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lekcji/tydzień</label>
              <input type="number" min={1} max={7} value={lessonsPerWeek} onChange={(e) => setLessonsPerWeek(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cena/lekcja (zł)</label>
              <input type="number" min={0} value={pricePerLesson} onChange={(e) => setPricePerLesson(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#23479E]" />
            <span className="text-sm font-medium text-gray-700">Aktywny</span>
          </label>
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="flex gap-2 mt-6">
          {plan && <button onClick={remove} className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50">Usuń</button>}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60">
            {saving ? 'Zapis...' : 'Zapisz'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CodeModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState('')
  const [kind, setKind] = useState<'percent' | 'amount'>('percent')
  const [value, setValue] = useState(10)
  const [description, setDescription] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!code.trim()) { setError('Podaj kod.'); return }
    setSaving(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('discount_codes').insert({
      code: code.trim().toUpperCase(),
      percent_off: kind === 'percent' ? value : null,
      amount_off: kind === 'amount' ? value : null,
      description: description || null,
      valid_until: validUntil || null,
      max_uses: maxUses ? Number(maxUses) : null,
    })
    setSaving(false)
    if (error) { setError('Nie udało się zapisać: ' + error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Nowy kod rabatowy</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kod</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="np. RODZENSTWO10"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm uppercase focus:outline-none focus:border-[#23479E]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Typ rabatu</label>
              <select value={kind} onChange={(e) => setKind(e.target.value as 'percent' | 'amount')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                <option value="percent">Procentowy (%)</option>
                <option value="amount">Kwotowy (zł)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Wartość</label>
              <input type="number" min={0} value={value} onChange={(e) => setValue(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ważny do (opc.)</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Limit użyć (opc.)</label>
              <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Opis (opc.)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="np. zniżka dla rodzeństwa"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            <Check size={16} />{saving ? 'Zapis...' : 'Utwórz kod'}
          </button>
        </div>
      </div>
    </div>
  )
}
