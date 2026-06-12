'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileCheck, Plus, X, Trash2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Terms = { id: string; version: number; title: string; content: string }
type Consent = { id: string; label: string; description: string; required: boolean }
type Acceptance = { id: string; name: string; email: string; termsVersion: number | null; consents: Record<string, boolean>; acceptedAt: string }

export function TermsView({ terms, consents, acceptances }: { terms: Terms | null; consents: Consent[]; acceptances: Acceptance[] }) {
  const router = useRouter()
  const [title, setTitle] = useState(terms?.title ?? 'Regulamin uNick Academy')
  const [content, setContent] = useState(terms?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [addingConsent, setAddingConsent] = useState(false)

  async function saveTerms() {
    setSaving(true); setMsg(null)
    const supabase = createClient()
    if (terms) {
      // nowa wersja regulaminu
      await supabase.from('terms_documents').update({ is_current: false }).eq('id', terms.id)
      await supabase.from('terms_documents').insert({ version: terms.version + 1, title, content, is_current: true })
    } else {
      await supabase.from('terms_documents').insert({ version: 1, title, content, is_current: true })
    }
    setSaving(false); setMsg('Zapisano nową wersję regulaminu.')
    router.refresh()
  }

  async function toggleConsentRequired(c: Consent) {
    const supabase = createClient()
    await supabase.from('consent_types').update({ required: !c.required }).eq('id', c.id)
    router.refresh()
  }
  async function removeConsent(id: string) {
    const supabase = createClient()
    await supabase.from('consent_types').update({ is_active: false }).eq('id', id)
    router.refresh()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><FileCheck size={22} />Regulamin i zgody</h1>

      {/* Regulamin */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Regulamin {terms && <span className="text-xs text-gray-400">(wersja {terms.version})</span>}</h2>
        </div>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:border-[#23479E]" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E] resize-none" />
        <div className="flex items-center gap-3 mt-3">
          <button onClick={saveTerms} disabled={saving} className="px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 disabled:opacity-60">
            {saving ? 'Zapisywanie...' : 'Zapisz nową wersję'}
          </button>
          {msg && <span className="text-sm text-gray-500">{msg}</span>}
        </div>
        <p className="text-xs text-gray-400 mt-2">Zapis tworzy nową wersję — uczniowie zaakceptowali konkretną wersję (rejestrowane poniżej).</p>
      </section>

      {/* Zgody */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Zgody przy zapisie</h2>
          <button onClick={() => setAddingConsent(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
            <Plus size={16} />Nowa zgoda
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {consents.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{c.label}</p>
                {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
              </div>
              <button onClick={() => toggleConsentRequired(c)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                {c.required ? 'Obowiązkowa' : 'Opcjonalna'}
              </button>
              <button onClick={() => removeConsent(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </section>

      {/* Log akceptacji */}
      <section>
        <h2 className="font-bold text-gray-900 mb-4">Kto i kiedy zaakceptował</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {acceptances.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">Brak zarejestrowanych akceptacji.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Osoba</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Regulamin</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Zgody</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {acceptances.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3"><p className="font-medium text-gray-900">{a.name}</p><p className="text-xs text-gray-400">{a.email}</p></td>
                    <td className="px-5 py-3 text-gray-600">wersja {a.termsVersion ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{Object.values(a.consents).filter(Boolean).length} zaakceptowanych</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(a.acceptedAt).toLocaleString('pl-PL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {addingConsent && <ConsentModal onClose={() => setAddingConsent(false)} onSaved={() => { setAddingConsent(false); router.refresh() }} />}
    </div>
  )
}

function ConsentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [label, setLabel] = useState(''); const [description, setDescription] = useState(''); const [required, setRequired] = useState(false)
  const [saving, setSaving] = useState(false)
  async function save() {
    if (!label.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('consent_types').insert({ label: label.trim(), description: description || null, required, sort: 99 })
    setSaving(false); onSaved()
  }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Nowa zgoda</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Treść zgody"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opis (opc.)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#23479E]" />
            <span className="text-sm font-medium text-gray-700">Obowiązkowa do zapisu</span>
          </label>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            <Check size={16} />Dodaj
          </button>
        </div>
      </div>
    </div>
  )
}
