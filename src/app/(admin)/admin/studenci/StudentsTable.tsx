'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Plus, AlertCircle, Pause, CheckCircle, FlaskConical, X, Mail, Phone, Clock, RotateCcw, Send, MessageSquare, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { StudentStatus, LanguageLevel } from '@/types'

const DAYS_PL = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

const AGE_GROUPS = [
  { id: '', label: '— wiek —' },
  { id: '3-6', label: '3–6 lat' },
  { id: '7-10', label: '7–10 lat' },
  { id: '11-14', label: '11–14 lat' },
  { id: '15-18', label: '15–18 lat' },
  { id: 'adult', label: 'Dorosły' },
]

const STATUS_CONFIG: Record<StudentStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Aktywny', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  trial: { label: 'Trial', color: 'bg-blue-100 text-blue-700', icon: FlaskConical },
  overdue: { label: 'Zaległość', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  paused: { label: 'Pauza', color: 'bg-gray-100 text-gray-600', icon: Pause },
}

const LEVELS: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const STATUSES: StudentStatus[] = ['active', 'trial', 'overdue', 'paused']

type Row = {
  id: string
  profileId: string
  name: string
  email: string
  phone: string
  level: LanguageLevel
  status: StudentStatus
  teacherId: string
  teacherName: string
  hours: number
  balance: number
  code: string
  joined: string
  billingType: 'individual' | 'b2b'
  customPrice: number | null
  vatRate: number | null
  nip: string
  companyName: string
  ageGroup: string
  customFields: Record<string, string>
  legalEntityId: string
  lessonDays: number[]
  lessonTypes: string[]
  active: boolean
}

type EntityOption = { id: string; short_name: string; name: string; vat_payer: boolean }

type DeletedRow = { id: string; name: string; email: string }

export function StudentsTable({
  rows,
  teacherOptions,
  deletedRows,
  entityOptions = [],
}: {
  rows: Row[]
  teacherOptions: { id: string; name: string }[]
  deletedRows: DeletedRow[]
  entityOptions?: EntityOption[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Row | null>(null)
  const [adding, setAdding] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  // Zakładka: aktywni (przypisani do zajęć / trwającego kursu) vs nieaktywni
  const [tab, setTab] = useState<'active' | 'inactive'>('active')
  // Filtry
  const [filterTeacher, setFilterTeacher] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [filterType, setFilterType] = useState('')
  // Zaznaczenie + akcje masowe
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulk, setBulk] = useState<'email' | 'sms' | null>(null)

  async function restore(id: string) {
    const supabase = createClient()
    await supabase.from('students').update({ deleted_at: null }).eq('id', id)
    router.refresh()
  }

  const activeCount = rows.filter((s) => s.active).length
  const inactiveCount = rows.length - activeCount

  const q = search.toLowerCase()
  const filtered = rows.filter((s) =>
    (tab === 'active' ? s.active : !s.active) &&
    (s.name.toLowerCase().includes(q) ||
      s.teacherName.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q)) &&
    (!filterTeacher || s.teacherId === filterTeacher) &&
    (filterDay === '' || s.lessonDays.includes(Number(filterDay))) &&
    (!filterType || s.lessonTypes.includes(filterType))
  )

  const filteredIds = filtered.map((s) => s.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id))
  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  function toggleAll() {
    setSelected((prev) => {
      if (filteredIds.every((id) => prev.has(id))) {
        const next = new Set(prev); filteredIds.forEach((id) => next.delete(id)); return next
      }
      return new Set([...prev, ...filteredIds])
    })
  }
  const selectedRows = rows.filter((r) => selected.has(r.id))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Studenci</h1>
        <div className="flex items-center gap-2">
          {deletedRows.length > 0 && (
            <button onClick={() => setShowTrash((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
              <Clock size={16} />Poczekalnia ({deletedRows.length})
            </button>
          )}
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">
            <Plus size={16} />Dodaj studenta
          </button>
        </div>
      </div>

      {showTrash && (
        <div className="bg-white rounded-2xl border border-gray-100 mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 text-sm font-bold text-gray-700">Poczekalnia — uczniowie</div>
          <div className="divide-y divide-gray-50">
            {deletedRows.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1"><p className="text-sm font-medium text-gray-900">{d.name}</p><p className="text-xs text-gray-400">{d.email}</p></div>
                <button onClick={() => restore(d.id)} className="flex items-center gap-1.5 text-xs text-[#23479E] hover:underline font-medium"><RotateCcw size={13} />Przywróć</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zakładki: aktywni / nieaktywni */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {([['active', 'Aktywni', activeCount], ['inactive', 'Nieaktywni', inactiveCount]] as const).map(([key, label, count]) => (
          <button key={key}
            onClick={() => { setTab(key); setSelected(new Set()) }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? 'bg-white text-[#23479E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label} <span className={`ml-1 ${tab === key ? 'text-[#23479E]/60' : 'text-gray-400'}`}>{count}</span>
          </button>
        ))}
      </div>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj po imieniu, nauczycielu lub kodzie..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm bg-white"
        />
      </div>

      {/* Filtry: nauczyciel · dzień zajęć · typ zajęć */}
      <div className="flex flex-wrap gap-2 mb-6">
        <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
          <option value="">Nauczyciel: wszyscy</option>
          {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
          <option value="">Dzień zajęć: wszystkie</option>
          {DAYS_PL.map((d, i) => <option key={d} value={i}>{d}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
          <option value="">Typ zajęć: wszystkie</option>
          <option value="offline">Stacjonarnie</option>
          <option value="online">Online</option>
        </select>
        {(filterTeacher || filterDay || filterType) && (
          <button onClick={() => { setFilterTeacher(''); setFilterDay(''); setFilterType('') }}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Wyczyść filtry</button>
        )}
      </div>

      {/* Pasek akcji masowych — widoczny gdy ktoś zaznaczony */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-[#EAF3FF] border border-blue-100 rounded-2xl px-4 py-3">
          <span className="text-sm font-semibold text-[#23479E]">Zaznaczono {selected.size}</span>
          <button onClick={() => setBulk('email')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Mail size={14} />Wyślij email
          </button>
          <button onClick={() => setBulk('sms')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <MessageSquare size={14} />Wyślij SMS
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-gray-500 hover:text-gray-700">Odznacz</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    aria-label="Zaznacz wszystkich" className="w-4 h-4 rounded border-gray-300 accent-[#23479E] cursor-pointer" />
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kontakt</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Poziom</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nauczyciel</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Godziny</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Saldo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dołączył/a</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((student) => {
                const cfg = STATUS_CONFIG[student.status]
                const Icon = cfg.icon
                return (
                  <tr key={student.id}
                    onClick={() => router.push(`/admin/studenci/${student.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(student.id)} onChange={() => toggle(student.id)}
                        aria-label={`Zaznacz ${student.name}`} className="w-4 h-4 rounded border-gray-300 accent-[#23479E] cursor-pointer" />
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{student.code}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-0.5">
                        {student.email ? (
                          <a href={`mailto:${student.email}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#23479E]">
                            <Mail size={12} className="text-gray-400" />{student.email}
                          </a>
                        ) : null}
                        {student.phone ? (
                          <a href={`tel:${student.phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#23479E]">
                            <Phone size={12} className="text-gray-400" />{student.phone}
                          </a>
                        ) : null}
                        {!student.email && !student.phone ? <span className="text-xs text-gray-300">—</span> : null}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded bg-[#EAF3FF] text-[#23479E] text-xs font-bold">{student.level}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{student.teacherName}</td>
                    <td className="px-5 py-4 text-gray-700">{student.hours}h</td>
                    <td className="px-5 py-4">
                      <span className={`font-bold ${student.balance < 0 ? 'text-red-500' : 'text-gray-700'}`}>
                        {student.balance < 0 ? student.balance : student.balance === 0 ? '✓' : `+${student.balance}`}
                        {student.balance !== 0 && ' zł'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        <Icon size={11} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{student.joined}</td>
                    <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditing(student)}
                        className="text-xs text-[#23479E] hover:underline font-medium"
                      >
                        Edytuj
                      </button>
                      <ChevronRight size={14} className="inline ml-2 text-gray-300" />
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-gray-400 text-sm">
                    Brak studentów spełniających kryteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} z {tab === 'active' ? activeCount : inactiveCount} {tab === 'active' ? 'aktywnych' : 'nieaktywnych'}
        </div>
      </div>

      {editing && (
        <EditModal
          row={editing}
          teacherOptions={teacherOptions}
          entityOptions={entityOptions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            router.refresh()
          }}
        />
      )}

      {adding && (
        <AddStudentModal
          teacherOptions={teacherOptions}
          onClose={() => setAdding(false)}
          onSaved={() => { setAdding(false); router.refresh() }}
        />
      )}

      {bulk && (
        <BulkMessageModal
          channel={bulk}
          recipients={selectedRows}
          onClose={() => setBulk(null)}
          onSent={() => { setBulk(null); setSelected(new Set()) }}
        />
      )}
    </div>
  )
}

function BulkMessageModal({ channel, recipients, onClose, onSent }: {
  channel: 'email' | 'sms'
  recipients: Row[]
  onClose: () => void
  onSent: () => void
}) {
  const isSms = channel === 'sms'
  const withContact = recipients.filter((r) => (isSms ? r.phone : r.email))
  const missing = recipients.length - withContact.length
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ sent: number; recipients: number; channelConfigured: boolean } | null>(null)

  async function send() {
    setError(null)
    if (!isSms && !subject.trim()) { setError('Podaj temat wiadomości.'); return }
    if (!body.trim()) { setError('Podaj treść wiadomości.'); return }
    setSending(true)
    const res = await fetch('/api/admin/communication/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: isSms ? 'sms' : 'email',
        segment: 'student_ids',
        studentIds: withContact.map((r) => r.id),
        subject: subject.trim(),
        body: body.trim(),
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSending(false)
    if (!res.ok) { setError(data.error ?? 'Nie udało się wysłać.'); return }
    setResult({ sent: data.sent ?? 0, recipients: data.recipients ?? withContact.length, channelConfigured: data.channelConfigured ?? false })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            {isSms ? <MessageSquare size={18} /> : <Mail size={18} />}
            {isSms ? 'Wyślij SMS' : 'Wyślij email'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {result ? (
          <div className="space-y-4">
            {result.channelConfigured ? (
              <div className="bg-green-50 rounded-xl p-4 text-sm text-green-700">
                Wysłano do {result.sent} z {result.recipients} odbiorców.
              </div>
            ) : (
              <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700">
                Kanał {isSms ? 'SMS' : 'email'} nie jest jeszcze skonfigurowany — wiadomość nie została wysłana.
                {isSms ? ' Ustaw SMSAPI_TOKEN w środowisku.' : ' Ustaw klucz Resend w środowisku.'}
              </div>
            )}
            <button onClick={onSent} className="w-full py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90">Gotowe</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Odbiorcy: <strong className="text-gray-700">{withContact.length}</strong>
              {missing > 0 && <span className="text-amber-600"> · {missing} bez {isSms ? 'numeru telefonu' : 'adresu email'} (pominięci)</span>}
            </p>
            <div className="space-y-3">
              {!isSms && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Temat</label>
                  <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Treść</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={isSms ? 4 : 6}
                  placeholder={isSms ? 'Krótka wiadomość SMS…' : 'Treść wiadomości…'}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E] resize-none" />
                {isSms && <p className="text-xs text-gray-400 mt-1">SMS rozliczany jest za każde 160 znaków. Do każdego odbiorcy trafia osobna wiadomość.</p>}
              </div>
            </div>
            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            <div className="flex gap-2 mt-6">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
              <button onClick={send} disabled={sending || withContact.length === 0}
                className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-1.5">
                <Send size={14} />{sending ? 'Wysyłanie...' : `Wyślij do ${withContact.length}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AddStudentModal({
  teacherOptions,
  onClose,
  onSaved,
}: {
  teacherOptions: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [level, setLevel] = useState<LanguageLevel>('A1')
  const [teacherId, setTeacherId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    if (!fullName.trim() || !email.trim()) { setError('Podaj imię i email.'); return }
    setSaving(true)
    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), level, teacherId }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Nie udało się dodać studenta.'); return }
    setTempPassword(data.tempPassword)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Dodaj studenta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {tempPassword ? (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-700 mb-2">Konto utworzone!</p>
              <p className="text-xs text-gray-600">Hasło tymczasowe (przekaż uczniowi — zmieni je przy pierwszym logowaniu):</p>
              <p className="font-mono text-sm bg-white rounded-lg px-3 py-2 mt-2 border border-green-200">{tempPassword}</p>
            </div>
            <button onClick={onSaved} className="w-full py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90">Gotowe</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Imię i nazwisko</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Poziom</label>
                  <select value={level} onChange={(e) => setLevel(e.target.value as LanguageLevel)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nauczyciel</label>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                  <option value="">— brak —</option>
                  {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            <div className="flex gap-2 mt-6">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
                {saving ? 'Tworzenie...' : 'Utwórz konto'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EditModal({
  row,
  teacherOptions,
  entityOptions,
  onClose,
  onSaved,
}: {
  row: Row
  teacherOptions: { id: string; name: string }[]
  entityOptions: EntityOption[]
  onClose: () => void
  onSaved: () => void
}) {
  const [level, setLevel] = useState<LanguageLevel>(row.level)
  const [status, setStatus] = useState<StudentStatus>(row.status)
  const [teacherId, setTeacherId] = useState(row.teacherId)
  const [phone, setPhone] = useState(row.phone)
  const [billingType, setBillingType] = useState<'individual' | 'b2b'>(row.billingType)
  const [legalEntityId, setLegalEntityId] = useState(row.legalEntityId)
  const [customPrice, setCustomPrice] = useState(row.customPrice != null ? String(row.customPrice) : '')
  const [vatRate, setVatRate] = useState(row.vatRate != null ? String(row.vatRate) : '23')
  const [nip, setNip] = useState(row.nip)
  const [companyName, setCompanyName] = useState(row.companyName)
  const [ageGroup, setAgeGroup] = useState(row.ageGroup)
  const [fields, setFields] = useState<{ k: string; v: string }[]>(
    Object.entries(row.customFields || {}).map(([k, v]) => ({ k, v: String(v) }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleBillingTypeChange(bt: 'individual' | 'b2b') {
    setBillingType(bt)
    // Auto-suggest legal entity based on billing type, but remain overridable
    const vatEntity = entityOptions.find((e) => e.vat_payer)
    const nonVatEntity = entityOptions.find((e) => !e.vat_payer)
    if (bt === 'b2b' && vatEntity) setLegalEntityId(vatEntity.id)
    else if (bt === 'individual' && nonVatEntity) setLegalEntityId(nonVatEntity.id)
  }

  function setField(i: number, key: 'k' | 'v', val: string) {
    setFields((f) => f.map((x, idx) => idx === i ? { ...x, [key]: val } : x))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const customFields = Object.fromEntries(fields.filter((f) => f.k.trim()).map((f) => [f.k.trim(), f.v]))
    const { error } = await supabase
      .from('students')
      .update({
        level,
        status,
        teacher_id: teacherId || null,
        age_group: ageGroup || null,
        custom_fields: customFields,
        billing_type: billingType,
        legal_entity_id: legalEntityId || null,
        custom_monthly_price: customPrice === '' ? null : Number(customPrice),
        vat_rate: billingType === 'b2b' && vatRate !== '' ? Number(vatRate) : null,
        nip: billingType === 'b2b' ? (nip || null) : null,
        company_name: billingType === 'b2b' ? (companyName || null) : null,
      })
      .eq('id', row.id)

    if (!error && phone !== row.phone) {
      await supabase.from('profiles').update({ phone: phone || null }).eq('id', row.profileId)
    }

    setSaving(false)
    if (error) {
      setError('Nie udało się zapisać: ' + error.message)
      return
    }
    onSaved()
  }

  async function softDelete() {
    if (!confirm('Przenieść ucznia do poczekalni? Można go stamtąd przywrócić.')) return
    const supabase = createClient()
    const { error } = await supabase.from('students').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    if (error) { setError('Nie udało się usunąć: ' + error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">{row.name}</h2>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/admin/studenci/${row.id}`} className="text-xs text-[#23479E] font-semibold hover:underline">Klient 360°</Link>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poziom</label>
            <select value={level} onChange={(e) => setLevel(e.target.value as LanguageLevel)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]">
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as StudentStatus)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]">
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nauczyciel</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]">
              <option value="">— brak —</option>
              {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+48 600 100 200"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria wiekowa</label>
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                {AGE_GROUPS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <label className="block text-xs font-medium text-gray-600 mb-2">Własne pola (uwagi, cele, preferencje…)</label>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={f.k} onChange={(e) => setField(i, 'k', e.target.value)} placeholder="Pole"
                    className="w-1/3 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
                  <input type="text" value={f.v} onChange={(e) => setField(i, 'v', e.target.value)} placeholder="Wartość"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
                  <button type="button" onClick={() => setFields((arr) => arr.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setFields((arr) => [...arr, { k: '', v: '' }])}
                className="text-xs text-[#23479E] font-medium hover:underline flex items-center gap-1"><Plus size={13} />Dodaj pole</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cena indywidualna (zł/mies., opc.)</label>
            <input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="zostaw puste = cennik bazowy"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>

          <div className="rounded-xl border border-gray-200 p-3">
            <label className="block text-xs font-medium text-gray-600 mb-2">Typ rozliczenia</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-3">
              {(['individual', 'b2b'] as const).map((bt) => (
                <button key={bt} type="button" onClick={() => handleBillingTypeChange(bt)}
                  className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${billingType === bt ? 'bg-[#23479E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {bt === 'individual' ? 'Indywidualny' : 'B2B (firma)'}
                </button>
              ))}
            </div>
            {billingType === 'b2b' && (
              <div className="space-y-2">
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Nazwa firmy"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={nip} onChange={(e) => setNip(e.target.value)} placeholder="NIP"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
                  <input type="number" value={vatRate} onChange={(e) => setVatRate(e.target.value)} placeholder="VAT %"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
                </div>
              </div>
            )}
          </div>

          {entityOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spółka rozliczeniowa</label>
              <select value={legalEntityId} onChange={(e) => setLegalEntityId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                {entityOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.short_name} — {opt.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Domyślnie UAI (bez VAT) dla klientów indywidualnych, UA (VAT) dla B2B. Można zmienić ręcznie.</p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-3">Saldo wyliczane jest z transakcji (zakładka Płatności).</p>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <div className="flex items-center gap-3 mt-6">
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50">
            Anuluj
          </button>
          <button onClick={softDelete} title="Przenieś do poczekalni"
            className="ml-auto px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 flex items-center gap-1.5">
            <Clock size={15} />Przenieś do poczekalni
          </button>
        </div>
      </div>
    </div>
  )
}
