'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Target, Users, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { B2bStage } from '@/types'

const STAGES: { id: B2bStage; label: string; color: string }[] = [
  { id: 'find', label: 'Find', color: '#94a3b8' },
  { id: 'approach', label: 'Approach', color: '#0891b2' },
  { id: 'convert', label: 'Convert', color: '#f59e0b' },
  { id: 'retain', label: 'Retain', color: '#16a34a' },
  { id: 'expand', label: 'Expand', color: '#7c3aed' },
]

type Lead = {
  id: string; companyName: string; contactName: string; email: string; phone: string
  employeesCount: number | null; goal: string; stage: B2bStage; value: number | null; notes: string; source: string
}

export function PipelineBoard({ leads }: { leads: Lead[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Lead | 'new' | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const totalValue = leads.reduce((acc, l) => acc + (l.value ?? 0), 0)

  async function moveToStage(id: string, stage: B2bStage) {
    const supabase = createClient()
    await supabase.from('b2b_leads').update({ stage, updated_at: new Date().toISOString() }).eq('id', id)
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Target size={22} />Pipeline B2B</h1>
          <p className="text-sm text-gray-500 mt-1">Lejek sprzedażowy · łączna wartość: <span className="font-bold text-[#23479E]">{totalValue.toLocaleString('pl-PL')} zł</span></p>
        </div>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} /> Nowy lead
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAGES.map((s) => {
          const stageLeads = leads.filter((l) => l.stage === s.id)
          const stageValue = stageLeads.reduce((acc, l) => acc + (l.value ?? 0), 0)
          return (
            <div key={s.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId) { moveToStage(dragId, s.id); setDragId(null) } }}
              className="bg-gray-50 rounded-2xl p-3 min-h-[200px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-sm font-bold text-gray-700">{s.label}</span>
                  <span className="text-xs text-gray-400">{stageLeads.length}</span>
                </div>
              </div>
              {stageValue > 0 && <p className="text-xs text-gray-400 px-1 mb-2">{stageValue.toLocaleString('pl-PL')} zł</p>}
              <div className="space-y-2">
                {stageLeads.map((l) => (
                  <div key={l.id} draggable
                    onDragStart={() => setDragId(l.id)} onDragEnd={() => setDragId(null)}
                    onClick={() => setEditing(l)}
                    className={`bg-white rounded-xl p-3 border border-gray-100 cursor-pointer hover:border-[#23479E] transition-colors ${dragId === l.id ? 'opacity-40' : ''}`}>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{l.companyName}</p>
                    {l.contactName && <p className="text-xs text-gray-500 mt-0.5">{l.contactName}</p>}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      {l.employeesCount != null && <span className="flex items-center gap-1"><Users size={11} />{l.employeesCount}</span>}
                      {l.value != null && <span className="font-semibold text-[#23479E]">{l.value.toLocaleString('pl-PL')} zł</span>}
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && <p className="text-xs text-gray-300 text-center py-4">—</p>}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4">Przeciągnij kartę między kolumnami, aby zmienić etap.</p>

      {editing && (
        <LeadModal lead={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh() }} />
      )}
    </div>
  )
}

function LeadModal({ lead, onClose, onSaved }: { lead: Lead | null; onClose: () => void; onSaved: () => void }) {
  const [companyName, setCompanyName] = useState(lead?.companyName ?? '')
  const [contactName, setContactName] = useState(lead?.contactName ?? '')
  const [email, setEmail] = useState(lead?.email ?? '')
  const [phone, setPhone] = useState(lead?.phone ?? '')
  const [employeesCount, setEmployeesCount] = useState(lead?.employeesCount != null ? String(lead.employeesCount) : '')
  const [stage, setStage] = useState<B2bStage>(lead?.stage ?? 'find')
  const [value, setValue] = useState(lead?.value != null ? String(lead.value) : '')
  const [goal, setGoal] = useState(lead?.goal ?? '')
  const [notes, setNotes] = useState(lead?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!companyName.trim()) { setError('Podaj nazwę firmy.'); return }
    setSaving(true); setError(null)
    const supabase = createClient()
    const payload = {
      company_name: companyName.trim(), contact_name: contactName || null, email: email || null,
      phone: phone || null, employees_count: employeesCount ? Number(employeesCount) : null,
      stage, value: value ? Number(value) : null, goal: goal || null, notes: notes || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = lead
      ? await supabase.from('b2b_leads').update(payload).eq('id', lead.id)
      : await supabase.from('b2b_leads').insert({ ...payload, source: 'admin' })
    setSaving(false)
    if (error) { setError('Nie udało się zapisać: ' + error.message); return }
    onSaved()
  }

  async function remove() {
    if (!lead || !confirm('Usunąć lead?')) return
    const supabase = createClient()
    await supabase.from('b2b_leads').delete().eq('id', lead.id)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">{lead ? 'Edytuj lead' : 'Nowy lead'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Firma</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Etap</label>
              <select value={stage} onChange={(e) => setStage(e.target.value as B2bStage)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Osoba kontaktowa</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Liczba pracowników</label>
              <input type="number" value={employeesCount} onChange={(e) => setEmployeesCount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Szacowana wartość (zł)</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cele szkolenia</label>
            <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="np. Business English dla działu sprzedaży"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notatki / historia kontaktu</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E] resize-none" />
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="flex gap-2 mt-6">
          {lead && <button onClick={remove} className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 flex items-center gap-1.5"><Trash2 size={14} />Usuń</button>}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60">
            {saving ? 'Zapis...' : 'Zapisz'}
          </button>
        </div>
      </div>
    </div>
  )
}
