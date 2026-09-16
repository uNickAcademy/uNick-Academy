'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, Phone } from 'lucide-react'
import { trackConversion, readCampaign, readReferralCode } from '@/lib/analytics/track'

// Zgłoszenie, nie zapis.
//
// Dwa pola i jeden wybór. Świadomie NIE pytamy o poziom, dostępność ani termin:
// to jest lepszy materiał na rozmowę niż na formularz, a każde dodatkowe pole
// kosztuje zgłoszenia. Właściwy zapis na konkretną grupę idzie potem linkiem
// do ActiveNow, gdy już wiemy, do czego kogoś zapisać.

const AUDIENCES = [
  { value: 'child', label: 'dla dziecka' },
  { value: 'teen', label: 'dla nastolatka' },
  { value: 'adult', label: 'dla siebie' },
  { value: 'company', label: 'dla firmy' },
] as const

const MARKETING_CLAUSE =
  'Wyrażam zgodę na otrzymywanie informacji marketingowych od uNick Academy drogą e-mail (opcjonalne). Zgodę można wycofać w każdej chwili klikając link w mailu.'

export function SignMeUpForm() {
  const [audience, setAudience] = useState<string>('child')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending) return
    setError(null)
    setSending(true)

    const form = new FormData(e.currentTarget)
    const marketing = form.get('consent_marketing') === 'on'

    try {
      const res = await fetch('/api/sign-me-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          phone: form.get('phone'),
          email: form.get('email') || null,
          audience,
          consentMarketing: marketing,
          consentClause: marketing ? MARKETING_CLAUSE : null,
          campaign: readCampaign(),
          referralCode: readReferralCode(),
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Nie udało się wysłać zgłoszenia.')

      trackConversion('generate_lead', { metaEvent: 'Lead', method: 'sign_me_up' })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się wysłać zgłoszenia.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 size={36} className="mx-auto mb-3 text-green-600" aria-hidden="true" />
        <h2 className="mb-2 text-xl font-black text-gray-900">Mamy Twój numer</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Oddzwonimy w ciągu jednego dnia roboczego. Porozmawiamy o tym, czego szukacie,
          i dobierzemy grupę albo nauczyciela.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
      <div className="space-y-5">
        <div>
          <label htmlFor="smu-name" className="mb-1.5 block text-sm font-bold text-gray-700">
            Imię
          </label>
          <input id="smu-name" name="name" type="text" required autoComplete="given-name"
            placeholder="Jak się do Ciebie zwracać"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#23479E] focus:outline-none focus:ring-2 focus:ring-[#23479E]/20" />
        </div>

        <div>
          <label htmlFor="smu-phone" className="mb-1.5 block text-sm font-bold text-gray-700">
            Telefon
          </label>
          <input id="smu-phone" name="phone" type="tel" required autoComplete="tel"
            inputMode="tel" placeholder="żebyśmy mogli oddzwonić"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#23479E] focus:outline-none focus:ring-2 focus:ring-[#23479E]/20" />
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-bold text-gray-700">
            Dla kogo szukacie zajęć
          </legend>
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map((a) => (
              <button key={a.value} type="button" onClick={() => setAudience(a.value)}
                aria-pressed={audience === a.value}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  audience === a.value
                    ? 'border-[#23479E] bg-[#23479E] text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-[#23479E] hover:text-[#23479E]'
                }`}>
                {a.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* E-mail zostaje opcjonalny: potrzebny tylko wtedy, gdy ktoś woli
            kontakt mailem albo zaznaczy zgodę marketingową. */}
        <div>
          <label htmlFor="smu-email" className="mb-1.5 block text-sm font-bold text-gray-700">
            E-mail <span className="font-medium text-gray-400">(opcjonalnie)</span>
          </label>
          <input id="smu-email" name="email" type="email" autoComplete="email"
            placeholder="jeśli wolisz kontakt mailem"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#23479E] focus:outline-none focus:ring-2 focus:ring-[#23479E]/20" />
        </div>

        <div className="space-y-2.5 border-t border-gray-100 pt-4">
          <label className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-500">
            <input type="checkbox" name="consent_privacy" required
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-[#23479E] focus:ring-[#23479E]" />
            <span>
              Akceptuję{' '}
              <Link href="/pl/privacy-policy" target="_blank" className="font-semibold text-[#23479E] underline">politykę prywatności</Link>
              {' '}oraz{' '}
              <Link href="/pl/terms-of-service" target="_blank" className="font-semibold text-[#23479E] underline">regulamin</Link>.
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-500">
            <input type="checkbox" name="consent_marketing"
              className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-[#23479E] focus:ring-[#23479E]" />
            <span>{MARKETING_CLAUSE}</span>
          </label>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={sending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D72614] py-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
          {sending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Phone size={17} aria-hidden="true" />}
          {sending ? 'Wysyłamy...' : 'Oddzwońcie do mnie'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Bez zapisów i bez zobowiązań. Najpierw rozmowa.
        </p>
      </div>
    </form>
  )
}
