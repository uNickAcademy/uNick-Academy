'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

export function B2bInquiryForm() {
  const [contactName, setContactName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [employeesCount, setEmployeesCount] = useState('')
  const [goal, setGoal] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim() || !email.trim()) { setError('Podaj nazwę firmy i email służbowy.'); return }
    setSending(true); setError(null)
    const res = await fetch('/api/b2b-inquiry', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, contactName, email, phone, employeesCount, goal }),
    })
    const data = await res.json().catch(() => ({}))
    setSending(false)
    if (!res.ok) { setError(data.error ?? 'Nie udało się wysłać. Spróbuj ponownie.'); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
        <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-black text-gray-900 mb-1">Dziękujemy!</h3>
        <p className="text-sm text-gray-500">Twoje zapytanie trafiło do naszego zespołu. Oddzwonimy w ciągu 24h.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <form className="space-y-4" onSubmit={submit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko *</label>
            <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors" placeholder="Jan Kowalski" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firma *</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors" placeholder="Nazwa firmy" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email służbowy *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors" placeholder="jan@firma.pl" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors" placeholder="+48 000 000 000" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Liczba pracowników do przeszkolenia</label>
          <select value={employeesCount} onChange={(e) => setEmployeesCount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors bg-white">
            <option value="">Wybierz zakres</option>
            <option value="3">1-5 osób</option>
            <option value="13">6-20 osób</option>
            <option value="35">21-50 osób</option>
            <option value="60">Ponad 50 osób</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cele szkolenia / dodatkowe informacje</label>
          <textarea rows={4} value={goal} onChange={(e) => setGoal(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors resize-none"
            placeholder="Branża, cele szkolenia, preferowane terminy..." />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={sending}
          className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-60">
          {sending ? 'Wysyłanie...' : 'Wyślij zapytanie'}
        </button>
      </form>
    </div>
  )
}
