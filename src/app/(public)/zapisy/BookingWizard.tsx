'use client'

import { useState } from 'react'
import { CheckCircle, ArrowLeft, ArrowRight, Monitor, MapPin, User, Users, Star } from 'lucide-react'
import type { LessonType, LessonFormat } from '@/types'

const TOTAL_STEPS = 5

type TeacherOpt = { id: string; name: string; levels: string[]; rating: number; color: string }
type Consent = { id: string; label: string; description: string; required: boolean }
type Terms = { version: number; title: string; content: string } | null

type Booking = {
  lessonType?: LessonType
  lessonFormat?: LessonFormat
  teacherId?: string
  date?: string
  time?: string
  fullName?: string
  email?: string
  phone?: string
  referralCode?: string
  discountCode?: string
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            i + 1 < current ? 'bg-[#23479E] text-white' : i + 1 === current ? 'gradient-primary text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}>
            {i + 1 < current ? <CheckCircle size={14} /> : i + 1}
          </div>
          {i < total - 1 && <div className={`w-8 h-0.5 ${i + 1 < current ? 'bg-[#23479E]' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

function Step1({ booking, set }: { booking: Booking; set: (b: Booking) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Jaki rodzaj lekcji?</h2>
      <p className="text-gray-500 text-center mb-8">Wybierz format, który Ci odpowiada</p>
      <div className="space-y-4 mb-6">
        <p className="text-sm font-semibold text-gray-700">Gdzie?</p>
        <div className="grid grid-cols-2 gap-3">
          {([{ value: 'online', label: 'Online', icon: Monitor, desc: 'Google Meet lub Zoom' },
             { value: 'offline', label: 'Stacjonarnie', icon: MapPin, desc: 'W naszym lokalu' }] as { value: LessonType; label: string; icon: typeof Monitor; desc: string }[]).map((opt) => {
            const Icon = opt.icon; const selected = booking.lessonType === opt.value
            return (
              <button key={opt.value} onClick={() => set({ ...booking, lessonType: opt.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${selected ? 'border-violet-500 bg-[#EAF3FF]' : 'border-gray-200 hover:border-violet-300'}`}>
                <Icon size={20} className={selected ? 'text-[#23479E]' : 'text-gray-400'} />
                <p className={`font-bold text-sm mt-2 ${selected ? 'text-[#23479E]' : 'text-gray-700'}`}>{opt.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-700">Z kim?</p>
        <div className="grid grid-cols-2 gap-3">
          {([{ value: 'individual', label: 'Indywidualnie', icon: User, desc: 'Tylko Ty i nauczyciel' },
             { value: 'group', label: 'Grupowo', icon: Users, desc: 'Maks. 4 osoby, niższa cena' }] as { value: LessonFormat; label: string; icon: typeof User; desc: string }[]).map((opt) => {
            const Icon = opt.icon; const selected = booking.lessonFormat === opt.value
            return (
              <button key={opt.value} onClick={() => set({ ...booking, lessonFormat: opt.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${selected ? 'border-violet-500 bg-[#EAF3FF]' : 'border-gray-200 hover:border-violet-300'}`}>
                <Icon size={20} className={selected ? 'text-[#23479E]' : 'text-gray-400'} />
                <p className={`font-bold text-sm mt-2 ${selected ? 'text-[#23479E]' : 'text-gray-700'}`}>{opt.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Step2({ booking, set, teachers }: { booking: Booking; set: (b: Booking) => void; teachers: TeacherOpt[] }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Wybierz nauczyciela</h2>
      <p className="text-gray-500 text-center mb-8">Nasz zespół lektorów</p>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {teachers.map((t) => {
          const selected = booking.teacherId === t.id
          return (
            <button key={t.id} onClick={() => set({ ...booking, teacherId: t.id })}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${selected ? 'border-violet-500 bg-[#EAF3FF]' : 'border-gray-200 hover:border-violet-300'}`}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black text-white flex-shrink-0" style={{ backgroundColor: t.color }}>{t.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${selected ? 'text-[#23479E]' : 'text-gray-900'}`}>{t.name}</span>
                  <span className="flex items-center gap-0.5 text-xs text-amber-600 font-medium"><Star size={11} className="fill-amber-400 text-amber-400" />{t.rating}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {t.levels.map((lvl) => <span key={lvl} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{lvl}</span>)}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Step3({ booking, set }: { booking: Booking; set: (b: Booking) => void }) {
  const minDate = new Date().toISOString().slice(0, 10)
  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Wybierz termin</h2>
      <p className="text-gray-500 text-center mb-8">Wybierz dogodny dzień i godzinę</p>
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <input type="date" min={minDate} value={booking.date || ''} onChange={(e) => set({ ...booking, date: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Godzina</label>
          <input type="time" step={1800} value={booking.time || ''} onChange={(e) => set({ ...booking, time: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center mt-4">Potwierdzimy dostępność lektora po rezerwacji.</p>
    </div>
  )
}

function Step4({ booking, set }: { booking: Booking; set: (b: Booking) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Twoje dane</h2>
      <p className="text-gray-500 text-center mb-8">Potwierdzimy rezerwację na emailu</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko</label>
          <input type="text" value={booking.fullName || ''} onChange={(e) => set({ ...booking, fullName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" placeholder="Jan Kowalski" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={booking.email || ''} onChange={(e) => set({ ...booking, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" placeholder="jan@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon (opc.)</label>
          <input type="tel" value={booking.phone || ''} onChange={(e) => set({ ...booking, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" placeholder="+48 600 000 000" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kod polecenia (opc.)</label>
            <input type="text" value={booking.referralCode || ''} onChange={(e) => set({ ...booking, referralCode: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" placeholder="KOD" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kod rabatowy (opc.)</label>
            <input type="text" value={booking.discountCode || ''} onChange={(e) => set({ ...booking, discountCode: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" placeholder="RABAT" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Step5({ booking, teachers, terms, consents, checked, setChecked }: {
  booking: Booking; teachers: TeacherOpt[]; terms: Terms; consents: Consent[]
  checked: Record<string, boolean>; setChecked: (c: Record<string, boolean>) => void
}) {
  const teacher = teachers.find((t) => t.id === booking.teacherId)
  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Potwierdź i zaakceptuj</h2>
      <p className="text-gray-500 mb-6 text-center">Sprawdź szczegóły i zgody</p>

      <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-2 mb-5 text-sm">
        <Row label="Nauczyciel" value={teacher?.name || '—'} />
        <Row label="Typ zajęć" value={`${booking.lessonType === 'online' ? 'Online' : 'Stacjonarnie'} · ${booking.lessonFormat === 'individual' ? 'Indywidualnie' : 'Grupowo'}`} />
        <Row label="Termin" value={booking.date && booking.time ? `${booking.date} ${booking.time}` : '—'} />
        <Row label="Imię i nazwisko" value={booking.fullName || '—'} />
        <Row label="Email" value={booking.email || '—'} />
        {booking.referralCode && <Row label="Kod polecenia" value={booking.referralCode} highlight />}
        {booking.discountCode && <Row label="Kod rabatowy" value={booking.discountCode} highlight />}
      </div>

      {terms && (
        <details className="mb-4 bg-white border border-gray-200 rounded-xl p-3">
          <summary className="text-sm font-semibold text-gray-700 cursor-pointer">{terms.title} (wersja {terms.version})</summary>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{terms.content}</p>
        </details>
      )}

      <div className="space-y-2">
        {consents.map((c) => (
          <label key={c.id} className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={!!checked[c.id]} onChange={(e) => setChecked({ ...checked, [c.id]: e.target.checked })}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#23479E]" />
            <span className="text-xs text-gray-600">{c.label}{c.required && <span className="text-red-500"> *</span>}{c.description && <span className="block text-gray-400">{c.description}</span>}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-[#23479E]' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}

export function BookingWizard({ teachers, terms, consents }: { teachers: TeacherOpt[]; terms: Terms; consents: Consent[] }) {
  const [step, setStep] = useState(1)
  const [booking, setBooking] = useState<Booking>({})
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requiredOk = consents.filter((c) => c.required).every((c) => checked[c.id])

  const canProceed = () => {
    if (step === 1) return booking.lessonType && booking.lessonFormat
    if (step === 2) return booking.teacherId
    if (step === 3) return booking.date && booking.time
    if (step === 4) return booking.fullName && booking.email
    return true
  }

  async function handleSubmit() {
    setError(null)
    if (!requiredOk) { setError('Zaakceptuj wymagane zgody, aby kontynuować.'); return }
    setSubmitting(true)
    const slot = new Date(`${booking.date}T${booking.time}`).toISOString()
    const res = await fetch('/api/booking', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonType: booking.lessonType, lessonFormat: booking.lessonFormat, teacherId: booking.teacherId,
        slot, fullName: booking.fullName, email: booking.email, phone: booking.phone,
        referralCode: booking.referralCode, discountCode: booking.discountCode,
        termsVersion: terms?.version ?? null, consents: checked,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSubmitting(false)
    if (!res.ok) { setError(data.error || 'Nie udało się zarezerwować. Spróbuj ponownie.'); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6"><CheckCircle size={48} className="text-[#23479E]" /></div>
        <h2 className="text-3xl font-black text-gray-900 mb-3">Gotowe! 🎉</h2>
        <p className="text-gray-500 text-lg mb-2">Rezerwacja potwierdzona.</p>
        <p className="text-gray-400 text-sm mb-8">Sprawdź email <strong>{booking.email}</strong> – wysłaliśmy szczegóły lekcji.</p>
        <button onClick={() => { setStep(1); setBooking({}); setChecked({}); setSubmitted(false) }}
          className="px-6 py-3 rounded-full border-2 border-violet-200 text-[#23479E] font-semibold hover:bg-[#EAF3FF] transition-colors text-sm">Zarezerwuj kolejną lekcję</button>
      </div>
    )
  }

  return (
    <div>
      <StepIndicator current={step} total={TOTAL_STEPS} />
      <div className="min-h-64">
        {step === 1 && <Step1 booking={booking} set={setBooking} />}
        {step === 2 && <Step2 booking={booking} set={setBooking} teachers={teachers} />}
        {step === 3 && <Step3 booking={booking} set={setBooking} />}
        {step === 4 && <Step4 booking={booking} set={setBooking} />}
        {step === 5 && <Step5 booking={booking} teachers={teachers} terms={terms} consents={consents} checked={checked} setChecked={setChecked} />}
      </div>

      {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"><ArrowLeft size={16} />Wstecz</button>
        ) : <div />}
        {step < TOTAL_STEPS ? (
          <button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-3 rounded-full gradient-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">Dalej<ArrowRight size={16} /></button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting || !requiredOk}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <CheckCircle size={16} />{submitting ? 'Rezerwuję...' : 'Potwierdź rezerwację'}</button>
        )}
      </div>
    </div>
  )
}
