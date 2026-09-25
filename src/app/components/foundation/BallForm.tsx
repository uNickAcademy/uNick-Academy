'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { BALL, MAX_PER_KIND, PAYMENT, summarise, TICKETS, type TicketCounts } from '@/lib/ball/event'
import styles from './BallForm.module.css'

/**
 * Zgłoszenie na The uNickorn Ball.
 *
 * Zgłoszenie to rezerwacja, nie opłacony bilet — tak jest napisane na
 * przycisku, w stopce formularza i na ekranie potwierdzenia, żeby nikt nie
 * wyszedł stąd z przekonaniem, że ma już opłacone miejsce.
 *
 * Kwotę liczy tu `summarise()` z lib/ball/event, tą samą funkcją, której używa
 * serwer. Wartość wyświetlona gościowi i wartość zapisana w bazie nie mają jak
 * się rozjechać.
 */

type Result = {
  reference: string
  seats: number
  amount: number
  ticketSummary: string
  emailSent: boolean
  payment: { recipient: string; iban: string; transferTitle: string; contactEmail: string } | null
}

type Errors = Record<string, string>

const KINDS = [
  { key: 'single' as const, ...TICKETS.single },
  { key: 'couple' as const, ...TICKETS.couple },
]

export default function BallForm() {
  const startedAt = useRef(0)
  const [counts, setCounts] = useState<TicketCounts>({ single: 1, couple: 0 })
  const [guests, setGuests] = useState<string[]>([''])
  const [dietary, setDietary] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => { startedAt.current = Date.now() }, [])

  const { seats, amount } = useMemo(() => summarise(counts), [counts])

  // Lista gości zawsze ma tyle pól, ile wykupionych miejsc. Przy zmianie
  // liczby biletów już wpisane nazwiska zostają — inaczej dodanie jednego
  // biletu kasowałoby to, co ktoś zdążył wpisać.
  useEffect(() => {
    setGuests((prev) => (
      prev.length === seats ? prev : Array.from({ length: seats }, (_, i) => prev[i] ?? '')
    ))
  }, [seats])

  function setCount(key: 'single' | 'couple', next: number) {
    setCounts((c) => ({ ...c, [key]: Math.max(0, Math.min(MAX_PER_KIND, next)) }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    setSending(true)
    setErrors({})

    const form = new FormData(event.currentTarget)
    const str = (k: string) => ((form.get(k) as string | null) ?? '').trim()

    try {
      const response = await fetch('/api/ball', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          singleTickets: counts.single,
          coupleTickets: counts.couple,
          guests,
          contactName: str('contactName'),
          email: str('email'),
          phone: str('phone'),
          tableRequest: str('tableRequest'),
          dietaryNotes: dietary.trim(),
          dietaryConsent: form.get('dietaryConsent') === 'on',
          termsAccepted: form.get('termsAccepted') === 'on',
          privacyAcknowledged: form.get('privacyAcknowledged') === 'on',
          website: form.get('website'),
          startedAt: startedAt.current,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setErrors(payload.errors ?? { form: payload.error ?? 'Nie udało się wysłać zgłoszenia.' })
        return
      }
      setResult(payload as Result)
    } catch {
      setErrors({ form: 'Nie udało się połączyć z serwerem. Spróbuj ponownie.' })
    } finally {
      setSending(false)
    }
  }

  if (result) {
    return (
      <div className={`${styles.form} ${styles.done}`} role="status">
        <h3 className={styles.doneTitle}>Zgłoszenie przyjęte</h3>

        <dl className={styles.doneFacts}>
          <div className={styles.doneFact}><dt>Numer zgłoszenia</dt><dd>{result.reference}</dd></div>
          <div className={styles.doneFact}><dt>Miejsca</dt><dd>{result.seats}</dd></div>
          <div className={styles.doneFact}><dt>Kwota do wpłaty</dt><dd>{result.amount} zł</dd></div>
        </dl>

        {result.emailSent ? (
          <p className={styles.doneText}>
            Dziękujemy! Wysłaliśmy e-mail z danymi do wpłaty. Miejsca potwierdzimy
            po zaksięgowaniu płatności.
          </p>
        ) : (
          <>
            <p className={styles.doneText}>
              Dziękujemy! Zgłoszenie zapisaliśmy, ale nie udało nam się wysłać e-maila
              z danymi do wpłaty. Poniżej masz wszystko, czego potrzeba do przelewu.
              Miejsca potwierdzimy po zaksięgowaniu płatności.
            </p>
            {result.payment && (
              <div className={styles.doneWarn}>
                <strong>Dane do przelewu</strong>
                <dl>
                  <dt>Odbiorca</dt><dd>{result.payment.recipient}</dd>
                  <dt>Numer rachunku</dt><dd>{result.payment.iban}</dd>
                  <dt>Tytuł przelewu</dt><dd>{result.payment.transferTitle}</dd>
                </dl>
                <p style={{ margin: '10px 0 0' }}>
                  W razie wątpliwości napisz na{' '}
                  <a href={`mailto:${result.payment.contactEmail}`}>{result.payment.contactEmail}</a>.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.honey} aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {/* ── bilety ── */}
      <fieldset className={styles.group} style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className={styles.legend}>Bilety</legend>
        <div className={styles.tickets}>
          {KINDS.map((kind) => {
            const value = counts[kind.key]
            return (
              <div key={kind.key} className={`${styles.ticket} ${value > 0 ? styles.ticketOn : ''}`}>
                <span className={styles.ticketCopy}>
                  <span className={styles.ticketName}>{kind.label}</span>
                  <span className={styles.ticketPrice}>
                    {kind.price} zł · {kind.seats === 1 ? '1 miejsce' : '2 miejsca'}
                  </span>
                </span>
                <span className={styles.stepper}>
                  <button type="button" className={styles.step} onClick={() => setCount(kind.key, value - 1)}
                    disabled={value === 0} aria-label={`Mniej: ${kind.label}`}>−</button>
                  <span className={styles.stepValue} aria-live="polite">{value}</span>
                  <button type="button" className={styles.step} onClick={() => setCount(kind.key, value + 1)}
                    disabled={value === MAX_PER_KIND} aria-label={`Więcej: ${kind.label}`}>+</button>
                </span>
              </div>
            )
          })}
        </div>
        {errors.tickets && <p className={styles.error}>{errors.tickets}</p>}

        <div className={styles.total}>
          <span className={styles.totalLabel}>
            Razem do wpłaty
            <span className={styles.totalSeats}>
              {seats === 0 ? 'nie wybrano miejsc' : `${seats} ${seats === 1 ? 'miejsce' : seats < 5 ? 'miejsca' : 'miejsc'}`}
            </span>
          </span>
          <span className={styles.totalAmount}>{amount} zł</span>
        </div>
      </fieldset>

      {/* ── goście ── */}
      {seats > 0 && (
        <fieldset className={styles.group} style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className={styles.legend}>Goście</legend>
          <p className={styles.hint}>Imię i nazwisko każdej osoby, dla której rezerwujesz miejsce.</p>
          <div className={styles.guests}>
            {guests.map((guest, i) => (
              <div key={i} className={styles.guestRow}>
                <span className={styles.guestIndex} aria-hidden="true">{i + 1}.</span>
                <input
                  className={`${styles.input} ${errors.guests ? styles.inputError : ''}`}
                  value={guest}
                  onChange={(e) => setGuests((g) => g.map((v, j) => (j === i ? e.target.value : v)))}
                  placeholder="Imię i nazwisko"
                  aria-label={`Gość ${i + 1}, imię i nazwisko`}
                  autoComplete="off"
                />
              </div>
            ))}
          </div>
          {errors.guests && <p className={styles.error}>{errors.guests}</p>}
        </fieldset>
      )}

      {/* ── osoba zgłaszająca ── */}
      <fieldset className={styles.group} style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className={styles.legend}>Osoba zgłaszająca</legend>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="ball-contact">Imię i nazwisko</label>
          <input id="ball-contact" name="contactName" autoComplete="name"
            className={`${styles.input} ${errors.contactName ? styles.inputError : ''}`} />
          {errors.contactName && <p className={styles.error}>{errors.contactName}</p>}
        </div>
        <div className={styles.twoUp}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ball-email">Adres e-mail</label>
            <input id="ball-email" name="email" type="email" autoComplete="email" inputMode="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`} />
            {errors.email && <p className={styles.error}>{errors.email}</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ball-phone">Telefon</label>
            <input id="ball-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel"
              placeholder="np. 600 100 200"
              className={`${styles.input} ${errors.phone ? styles.inputError : ''}`} />
            {errors.phone && <p className={styles.error}>{errors.phone}</p>}
          </div>
        </div>
        <p className={styles.hint}>Na ten adres wyślemy numer zgłoszenia i dane do wpłaty.</p>
      </fieldset>

      {/* ── stolik i posiłki ── */}
      <fieldset className={styles.group} style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className={styles.legend}>Stolik i posiłki <span className={styles.optional}>opcjonalnie</span></legend>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="ball-table">
            Z kim chcielibyście siedzieć przy stoliku? Podaj imiona i nazwiska tych osób
          </label>
          <textarea id="ball-table" name="tableRequest" className={styles.textarea}
            placeholder="np. Anna i Piotr Kowalscy, Maria Nowak" />
          <p className={styles.hint}>Postaramy się uwzględnić tę prośbę przy układaniu stolików.</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="ball-diet">Potrzeby żywieniowe i alergie</label>
          <textarea id="ball-diet" name="dietaryNotes" className={styles.textarea}
            value={dietary} onChange={(e) => setDietary(e.target.value)}
            placeholder="np. dieta wegetariańska, alergia na orzechy" />
          <p className={styles.hint}>
            Podanie tych informacji jest dobrowolne. Sprawdzimy z hotelem możliwość ich
            uwzględnienia, ale zgłoszenie nie gwarantuje odrębnego menu.
          </p>
          {/* Informacje o diecie i alergiach potrafią ujawnić dane o zdrowiu, więc
              mają własną zgodę (§8 ust. 2 regulaminu). Pytamy o nią dopiero, gdy
              ktoś faktycznie coś wpisze. */}
          {dietary.trim() && (
            <label className={styles.consent} style={{ marginTop: 4 }}>
              <input type="checkbox" name="dietaryConsent" />
              <span>
                Zgadzam się, aby Fundacja przetwarzała podane informacje o diecie i alergiach
                w celu organizacji posiłków i przekazała je hotelowi.
              </span>
            </label>
          )}
          {errors.dietaryConsent && <p className={styles.error}>{errors.dietaryConsent}</p>}
        </div>
      </fieldset>

      {/* ── zgody ── */}
      <div className={styles.consents}>
        <label className={styles.consent}>
          <input type="checkbox" name="termsAccepted" />
          <span>
            Akceptuję{' '}
            <a href={BALL.termsPath} target="_blank" rel="noreferrer">regulamin The uNickorn Ball</a>{' '}
            i przyjmuję do wiadomości, że wysłanie formularza nie jest opłaceniem biletu.
          </span>
        </label>
        {errors.termsAccepted && <p className={styles.error}>{errors.termsAccepted}</p>}

        <label className={styles.consent}>
          <input type="checkbox" name="privacyAcknowledged" />
          <span>
            Zapoznałem/am się z{' '}
            <a href="/pl/foundation/bal-dane" target="_blank" rel="noreferrer">informacją o przetwarzaniu danych</a>{' '}
            przez UNICK ACADEMY FOUNDATION.
          </span>
        </label>
        {errors.privacyAcknowledged && <p className={styles.error}>{errors.privacyAcknowledged}</p>}
      </div>

      {errors.form && <p className={styles.formError} role="alert">{errors.form}</p>}

      <button type="submit" className={styles.submit} disabled={sending || seats === 0}>
        {sending ? 'Wysyłamy zgłoszenie...' : `Zgłaszam udział · ${amount} zł`}
      </button>

      <p className={styles.footnote}>
        Wysłanie formularza to rezerwacja miejsc, nie zakup opłaconego biletu.
        Dane do przelewu wyślemy e-mailem, a miejsca potwierdzimy po zaksięgowaniu wpłaty.
        Wpłata w ciągu {PAYMENT.deadlineHours} godzin.
      </p>
    </form>
  )
}
