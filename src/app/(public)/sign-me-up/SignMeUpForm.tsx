'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Loader2, Send } from 'lucide-react'
import UNickorn from '@/app/components/UNickorn'
import { trackConversion, readCampaign, readReferralCode } from '@/lib/analytics/track'
import styles from './SignMeUp.module.css'

// Zgłoszenie chęci udziału w zajęciach, nie zapis.
//
// Obowiązkowe są trzy rzeczy: imię, telefon i dla kogo. Reszta siedzi w
// rozwijanej sekcji i jest w pełni opcjonalna — kto chce od razu powiedzieć
// więcej, mówi, a kto nie chce, wysyła zgłoszenie w trzy pola. Wcześniejsza
// wersja pytała tylko o to minimum i ludzie nie mieli gdzie dopisać kontekstu.
//
// Właściwy zapis na konkretną grupę idzie potem linkiem do ActiveNow, gdy już
// wiadomo, do czego kogoś zapisać.

const AUDIENCES = [
  { value: 'child', label: 'dla dziecka' },
  { value: 'teen', label: 'dla nastolatka' },
  { value: 'adult', label: 'dla siebie' },
  { value: 'company', label: 'dla firmy' },
] as const

const LEVELS = [
  { value: '', label: 'nie wiem, sprawdźcie' },
  { value: 'beginner', label: 'początkujący' },
  { value: 'intermediate', label: 'średniozaawansowany' },
  { value: 'advanced', label: 'zaawansowany' },
]

const MODES = [
  { value: '', label: 'wszystko jedno' },
  { value: 'group', label: 'zajęcia grupowe' },
  { value: 'individual', label: 'zajęcia indywidualne' },
]

const FORMATS = [
  { value: 'any', label: 'wszystko jedno' },
  { value: 'rumianek', label: 'stacjonarnie w Rumianku' },
  { value: 'online', label: 'online' },
]

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

    const f = new FormData(e.currentTarget)
    const marketing = f.get('consent_marketing') === 'on'
    const str = (k: string) => (f.get(k) as string | null)?.trim() || null

    try {
      const res = await fetch('/api/sign-me-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: str('name'),
          phone: str('phone'),
          email: str('email'),
          audience,
          studentName: str('studentName'),
          studentAge: str('studentAge'),
          level: str('level'),
          mode: str('mode'),
          format: str('format'),
          note: str('note'),
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
      <div className={styles.done} role="status">
        <UNickorn variant="trophy" size={84} />
        <h2 className={styles.doneTitle}>Mamy Wasze zgłoszenie</h2>
        <p className={styles.doneText}>
          Odezwiemy się w ciągu jednego dnia roboczego. Porozmawiamy o tym, czego
          szukacie, i dobierzemy grupę albo nauczyciela. Nic jeszcze nie jest
          przesądzone i do niczego to Was nie zobowiązuje.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.card}>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="smu-name">Imię</label>
          <input id="smu-name" name="name" type="text" required autoComplete="given-name"
            placeholder="Jak się do Ciebie zwracać" className={styles.input} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="smu-phone">Telefon</label>
          <input id="smu-phone" name="phone" type="tel" required autoComplete="tel"
            inputMode="tel" placeholder="żebyśmy mogli oddzwonić" className={styles.input} />
        </div>

        <fieldset className={styles.field} style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className={styles.label} style={{ padding: 0 }}>Dla kogo szukacie zajęć</legend>
          <div className={styles.chips}>
            {AUDIENCES.map((a) => (
              <button key={a.value} type="button" onClick={() => setAudience(a.value)}
                aria-pressed={audience === a.value}
                className={`${styles.chip} ${audience === a.value ? styles.chipOn : ''}`}>
                {a.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Wszystko poniżej jest opcjonalne i domyślnie schowane. Zgłoszenie
            wysyła się bez rozwijania tej sekcji. */}
        <details className={styles.details}>
          <summary className={styles.summary}>
            <ChevronDown size={17} className={styles.chevron} aria-hidden="true" />
            Dodaj szczegóły
            <span className={styles.summaryHint}>opcjonalnie</span>
          </summary>

          <div className={styles.detailsBody}>
            <div className={styles.twoUp}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="smu-student">
                  Imię ucznia <span className={styles.optional}>(jeśli to nie Ty)</span>
                </label>
                <input id="smu-student" name="studentName" type="text"
                  placeholder="np. Zosia" className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="smu-age">Wiek</label>
                <input id="smu-age" name="studentAge" type="number" min={1} max={120}
                  inputMode="numeric" placeholder="np. 9" className={styles.input} />
              </div>
            </div>

            <div className={styles.twoUp}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="smu-level">Poziom angielskiego</label>
                <select id="smu-level" name="level" className={styles.select} defaultValue="">
                  {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="smu-mode">Rodzaj zajęć</label>
                <select id="smu-mode" name="mode" className={styles.select} defaultValue="">
                  {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="smu-format">Gdzie</label>
              <select id="smu-format" name="format" className={styles.select} defaultValue="any">
                {FORMATS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="smu-note">
                Kiedy Wam pasuje i co jeszcze powinniśmy wiedzieć
              </label>
              <textarea id="smu-note" name="note" className={styles.textarea}
                placeholder="np. popołudniami od wtorku do czwartku, dziecko jest nieśmiałe i wolałoby małą grupę" />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="smu-email">
                E-mail <span className={styles.optional}>(jeśli wolisz kontakt mailem)</span>
              </label>
              <input id="smu-email" name="email" type="email" autoComplete="email"
                placeholder="adres@example.com" className={styles.input} />
            </div>
          </div>
        </details>

        <div className={styles.consents}>
          <label className={styles.consent}>
            <input type="checkbox" name="consent_privacy" required />
            <span>
              Akceptuję{' '}
              <Link href="/pl/privacy-policy" target="_blank">politykę prywatności</Link>
              {' '}oraz{' '}
              <Link href="/pl/terms-of-service" target="_blank">regulamin</Link>.
            </span>
          </label>
          <label className={styles.consent}>
            <input type="checkbox" name="consent_marketing" />
            <span>{MARKETING_CLAUSE}</span>
          </label>
        </div>

        {error && <p role="alert" className={styles.error}>{error}</p>}

        <button type="submit" disabled={sending} className={styles.submit}>
          {sending
            ? <Loader2 size={19} className={styles.spin} aria-hidden="true" />
            : <Send size={18} aria-hidden="true" />}
          {sending ? 'Wysyłamy...' : 'Wyślij zgłoszenie'}
        </button>

        <p className={styles.footnote}>
          To nie jest zapis ani zobowiązanie. Najpierw rozmowa.
        </p>
      </div>
    </form>
  )
}
