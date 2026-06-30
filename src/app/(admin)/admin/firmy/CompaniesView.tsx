'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Building2, UserPlus, Users, FileText, Check, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Company = { id: string; name: string; nip: string; address: string; employeeCount: number; hrName: string | null }
type StudentOpt = { id: string; name: string; companyId: string }
type Inv = { id: string; companyId: string; number: string; gross: number; period: string; issuedAt: string; companyName: string | null }
type EntityOpt = { id: string; short_name: string; name: string; vat_payer: boolean }

export function CompaniesView({ companies, students, invoices }: { companies: Company[]; students: StudentOpt[]; invoices: Inv[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [managing, setManaging] = useState<Company | null>(null)
  const [entities, setEntities] = useState<EntityOpt[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.rpc('list_billing_entities').then(({ data }) => {
      if (data) setEntities(data as EntityOpt[])
    })
  }, [])

  const uaEntity = entities.find((e) => e.vat_payer)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Building2 size={22} />Firmy (B2B)</h1>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} /> Nowa firma
        </button>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center text-gray-400 text-sm">
          Brak firm. Dodaj klienta B2B, aby zarządzać pracownikami i kontem HR.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {companies.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-black text-gray-900">{c.name}</h3>
                  {c.nip && <p className="text-xs text-gray-400">NIP: {c.nip}</p>}
                </div>
                <span className="flex items-center gap-1 text-xs text-gray-500"><Users size={13} />{c.employeeCount}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Kontakt HR: {c.hrName ? <span className="font-semibold text-gray-900">{c.hrName}</span> : <span className="text-amber-600">brak</span>}
              </p>
              <button onClick={() => setManaging(c)}
                className="w-full py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Zarządzaj firmą
              </button>
            </div>
          ))}
        </div>
      )}

      {creating && <CompanyModal onClose={() => setCreating(false)} onSaved={() => { setCreating(false); router.refresh() }} />}
      {managing && (
        <ManageModal company={managing} students={students} uaEntityId={uaEntity?.id ?? null}
          invoices={invoices.filter((i) => i.companyId === managing.id)}
          onClose={() => setManaging(null)} onChanged={() => router.refresh()} />
      )}
    </div>
  )
}

function CompanyModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [nip, setNip] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [gusLoading, setGusLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gusError, setGusError] = useState<string | null>(null)

  const nipDigits = nip.replace(/[^0-9]/g, '')

  async function fetchFromGus() {
    setGusLoading(true)
    setGusError(null)
    try {
      const res = await fetch(`/api/admin/companies/gus-lookup?nip=${encodeURIComponent(nipDigits)}`)
      const data = await res.json()
      if (!res.ok) {
        setGusError(data.error ?? 'Błąd GUS')
        return
      }
      if (data.name) setName(data.name)
      const { street, city, postal_code } = data.address ?? {}
      const parts = [street, postal_code && city ? `${postal_code} ${city}` : city].filter(Boolean)
      if (parts.length) setAddress(parts.join(', '))
    } catch {
      setGusError('Nie udało się pobrać danych z GUS')
    } finally {
      setGusLoading(false)
    }
  }

  async function save() {
    if (!name.trim()) { setError('Podaj nazwę.'); return }
    setSaving(true); setError(null)
    const supabase = createClient()
    // legal_entity_id defaults to UA via DB column default set in migration
    const { error } = await supabase.from('companies').insert({ name: name.trim(), nip: nip || null, address: address || null })
    setSaving(false)
    if (error) { setError('Nie udało się: ' + error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Nowa firma</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex gap-2">
              <input type="text" value={nip} onChange={(e) => { setNip(e.target.value); setGusError(null) }} placeholder="NIP (10 cyfr)"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
              <button
                onClick={fetchFromGus}
                disabled={nipDigits.length !== 10 || gusLoading}
                title="Pobierz dane z GUS"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[#23479E] hover:bg-[#EAF3FF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
                <Search size={14} />
                {gusLoading ? 'Szukam...' : 'Pobierz z GUS'}
              </button>
            </div>
            {gusError && <p className="text-xs text-red-500 mt-1">{gusError}</p>}
          </div>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa firmy"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adres"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          <p className="text-xs text-gray-400">Każda firma korporacyjna jest rozliczana przez UA (spółka z VAT).</p>
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60">
            {saving ? 'Tworzenie...' : 'Utwórz firmę'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ManageModal({ company, students, invoices, uaEntityId, onClose, onChanged }: {
  company: Company; students: StudentOpt[]; invoices: Inv[]; uaEntityId: string | null; onClose: () => void; onChanged: () => void
}) {
  const employees = students.filter((s) => s.companyId === company.id)
  const available = students.filter((s) => !s.companyId)
  const [toAdd, setToAdd] = useState('')
  const [hrName, setHrName] = useState(''); const [hrEmail, setHrEmail] = useState(''); const [hrPhone, setHrPhone] = useState('')
  const [hrPassword, setHrPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [invNum, setInvNum] = useState(''); const [net, setNet] = useState(''); const [vat, setVat] = useState('23'); const [period, setPeriod] = useState(''); const [gtu, setGtu] = useState('')

  async function addEmployee() {
    if (!toAdd) return
    const supabase = createClient()
    const update: Record<string, unknown> = { company_id: company.id, billing_type: 'b2b' }
    if (uaEntityId) update.legal_entity_id = uaEntityId
    await supabase.from('students').update(update).eq('id', toAdd)
    setToAdd(''); onChanged()
  }
  async function removeEmployee(id: string) {
    const supabase = createClient()
    await supabase.from('students').update({ company_id: null }).eq('id', id)
    onChanged()
  }
  async function createHr() {
    if (!hrName.trim() || !hrEmail.trim()) { setError('Podaj imię i email HR.'); return }
    setBusy(true); setError(null)
    const res = await fetch('/api/admin/hr', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: hrName.trim(), email: hrEmail.trim(), phone: hrPhone.trim(), companyId: company.id }),
    })
    const data = await res.json(); setBusy(false)
    if (!res.ok) { setError(data.error ?? 'Nie udało się utworzyć HR.'); return }
    setHrPassword(data.tempPassword); onChanged()
  }
  async function issueInvoice() {
    if (!invNum.trim() || !net) { setError('Podaj numer i kwotę netto.'); return }
    setBusy(true); setError(null)
    const netN = Number(net), vatN = Number(vat)
    const vatAmount = Math.round(netN * vatN) / 100
    const supabase = createClient()
    const { error } = await supabase.from('invoices').insert({
      company_id: company.id, number: invNum.trim(), net_amount: netN,
      vat_amount: vatAmount, gross_amount: netN + vatAmount, period: period || null, status: 'issued',
      gtu_codes: gtu || null,
    })
    setBusy(false)
    if (error) { setError('Nie udało się wystawić: ' + error.message); return }
    setInvNum(''); setNet(''); setPeriod(''); setGtu(''); onChanged()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">{company.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        {/* Kontakt HR */}
        <section className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><UserPlus size={15} />Kontakt HR</h3>
          {company.hrName ? (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{company.hrName} — konto HR już istnieje.</p>
          ) : hrPassword ? (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-sm font-semibold text-green-700 mb-1">Konto HR utworzone!</p>
              <p className="text-xs text-gray-600">Hasło tymczasowe:</p>
              <p className="font-mono text-sm bg-white rounded px-2 py-1 mt-1 border border-green-200">{hrPassword}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <input type="text" value={hrName} onChange={(e) => setHrName(e.target.value)} placeholder="Imię i nazwisko"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
              <div className="grid grid-cols-2 gap-2">
                <input type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} placeholder="Email"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
                <input type="tel" value={hrPhone} onChange={(e) => setHrPhone(e.target.value)} placeholder="Telefon"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
              </div>
              <button onClick={createHr} disabled={busy}
                className="w-full py-2 rounded-lg gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60">
                {busy ? 'Tworzenie...' : 'Utwórz konto HR'}
              </button>
            </div>
          )}
        </section>

        {/* Pracownicy */}
        <section className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><Users size={15} />Pracownicy ({employees.length})</h3>
          <div className="space-y-1.5 mb-2 max-h-32 overflow-y-auto">
            {employees.length === 0 ? <p className="text-xs text-gray-400">Brak przypisanych pracowników.</p> :
              employees.map((e) => (
                <div key={e.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                  <span className="text-sm text-gray-700 flex-1">{e.name}</span>
                  <button onClick={() => removeEmployee(e.id)} className="text-xs text-gray-400 hover:text-red-500">Usuń</button>
                </div>
              ))}
          </div>
          <div className="flex gap-2">
            <select value={toAdd} onChange={(e) => setToAdd(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
              <option value="">Dodaj pracownika (uczeń bez firmy)...</option>
              {available.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={addEmployee} disabled={!toAdd} className="px-4 py-2 rounded-lg gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-40">Dodaj</button>
          </div>
        </section>

        {/* Faktury */}
        <section>
          <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><FileText size={15} />Faktury ({invoices.length})</h3>
          <div className="space-y-1.5 mb-3 max-h-28 overflow-y-auto">
            {invoices.length === 0 ? <p className="text-xs text-gray-400">Brak faktur.</p> :
              invoices.map((i) => (
                <div key={i.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
                  <span className="font-mono text-gray-700">{i.number}</span>
                  <span className="text-gray-400 text-xs">{i.period}</span>
                  <span className="ml-auto font-bold text-gray-900">{i.gross.toLocaleString('pl-PL')} zł</span>
                </div>
              ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input type="text" value={invNum} onChange={(e) => setInvNum(e.target.value)} placeholder="Nr faktury (np. FV 1/2026)"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Okres (np. czerwiec 2026)"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>
          <input type="text" value={gtu} onChange={(e) => setGtu(e.target.value)} placeholder="Kody GTU (np. GTU_12)"
            className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          <div className="flex gap-2">
            <input type="number" value={net} onChange={(e) => setNet(e.target.value)} placeholder="Netto zł"
              className="w-1/3 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            <input type="number" value={vat} onChange={(e) => setVat(e.target.value)} placeholder="VAT %"
              className="w-1/4 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            <button onClick={issueInvoice} disabled={busy} className="flex-1 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1.5">
              <Check size={14} />Wystaw fakturę
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Generowanie PDF i integracja z systemem księgowym (wFirma/Fakturownia) — do włączenia później. Tu rejestrujemy wystawione faktury, widoczne dla HR.</p>
        </section>
      </div>
    </div>
  )
}
