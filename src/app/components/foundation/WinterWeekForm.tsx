'use client'

import Link from 'next/link'
import {FormEvent, useEffect, useRef, useState} from 'react'
import Button from '../Button'
import * as O from '@/lib/foundation/options'
import {projectSchedule} from '@/lib/foundation/schedule'
import {foundationGroupOptions} from '@/lib/foundation/groups'
import {validateWinterRegistration} from '@/lib/winter/validation'
import {WINTER} from '@/lib/winter/event'
import styles from './FoundationInterestForm.module.css'

type Errors = Record<string, string>

const Err = ({name, errors}: {name: string; errors: Errors}) => errors[name]
  ? <p id={`${name}-error`} className={styles.error}>{errors[name]}</p>
  : null

export default function WinterWeekForm() {
  const startedAt = useRef(0)
  const errorSummary = useRef<HTMLDivElement>(null)
  const [birthDate, setBirthDate] = useState('')
  const [regular, setRegular] = useState<'' | 'yes' | 'no'>('')
  const [groups, setGroups] = useState<string[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  const participantAge = O.calculateAgeOnDate(birthDate)

  useEffect(() => { startedAt.current = Date.now() }, [])

  const keepEligibleGroups = (nextBirthDate: string) => {
    const age = O.calculateAgeOnDate(nextBirthDate)
    const eligible = age == null
      ? []
      : foundationGroupOptions.filter(group => age >= group.minAge && age <= group.maxAge).map(group => group.id)
    setGroups(current => current.filter(id => eligible.includes(id)))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      participantName: form.get('participantName'),
      birthDate: form.get('birthDate'),
      municipality: form.get('municipality'),
      residenceConfirmed: form.get('residenceConfirmed') === 'on',
      regularParticipant: regular === '' ? null : regular === 'yes',
      regularGroups: regular === 'yes' ? groups : [],
      attendanceDeclaration: form.get('attendanceDeclaration') === 'on',
      rulesAccepted: form.get('rulesAccepted') === 'on',
      specialNeeds: form.get('specialNeeds'),
      contactName: form.get('contactName'),
      email: form.get('email'),
      phone: form.get('phone'),
      consentContact: form.get('consentContact') === 'on',
      privacyAcknowledged: form.get('privacyAcknowledged') === 'on',
      startedAt: startedAt.current,
    }
    const validation = validateWinterRegistration(payload)
    if (!validation.ok) {
      setErrors(validation.errors)
      requestAnimationFrame(() => errorSummary.current?.focus())
      return
    }

    setSending(true)
    setErrors({})
    try {
      const response = await fetch('/api/winter-week', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setErrors(result.errors || {form: result.error || `Nie udało się wysłać zgłoszenia. Spróbuj ponownie lub napisz na ${WINTER.contactEmail}.`})
        requestAnimationFrame(() => errorSummary.current?.focus())
      } else {
        setReference(result.reference || '')
      }
    } catch {
      setErrors({form: `Nie udało się wysłać zgłoszenia. Spróbuj ponownie lub napisz na ${WINTER.contactEmail}.`})
      requestAnimationFrame(() => errorSummary.current?.focus())
    } finally {
      setSending(false)
    }
  }

  if (reference !== null) return <div className={`${styles.shell} ${styles.success}`} role="status" aria-live="polite">
    <span className={styles.successMark} aria-hidden="true">✓</span>
    <h3>Dziękujemy, zgłoszenie jest zapisane</h3>
    <p>Numer zgłoszenia: <strong>{reference}</strong>. Wysłaliśmy potwierdzenie na podany adres e-mail. Wysłanie formularza nie gwarantuje miejsca. Skontaktujemy się w sprawie potwierdzenia udziału.</p>
  </div>

  return <form className={styles.shell} onSubmit={submit} noValidate aria-busy={sending}>
    <p className={styles.requiredHint}>Pola oznaczone * są wymagane.</p>
    {Object.keys(errors).length > 0 && <div ref={errorSummary} tabIndex={-1} role="alert" className={styles.summary}>
      <h3>Sprawdź formularz</h3>
      <ul>{Object.values(errors).map(error => <li key={error}>{error}</li>)}</ul>
    </div>}

    <fieldset disabled={sending}>
      <legend>1. Uczestnik</legend>
      <div className={styles.cols}>
        <label>Imię i nazwisko uczestnika *
          <input name="participantName" maxLength={120} autoComplete="off" aria-invalid={Boolean(errors.participantName)} aria-describedby="participantName-error"/>
          <Err name="participantName" errors={errors}/>
        </label>
        <label>Data urodzenia *
          <input
            name="birthDate"
            type="date"
            min="2007-11-02"
            max="2016-11-01"
            value={birthDate}
            aria-invalid={Boolean(errors.birthDate)}
            aria-describedby="birth-date-hint birthDate-error"
            onChange={event => {
              setBirthDate(event.target.value)
              keepEligibleGroups(event.target.value)
            }}
          />
          <small id="birth-date-hint">Wiek liczymy na 1 listopada 2026 r., tak samo jak w zajęciach regularnych.{participantAge != null && ` Wtedy uczestnik będzie mieć ${participantAge} lat.`}</small>
          <Err name="birthDate" errors={errors}/>
        </label>
      </div>

      <label>Gmina zamieszkania *
        <select name="municipality" defaultValue="" aria-invalid={Boolean(errors.municipality)} aria-describedby="municipality-error">
          <option value="">Wybierz gminę</option>
          {O.municipalityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <Err name="municipality" errors={errors}/>
      </label>

      <label className={styles.consent}>
        <input type="checkbox" name="residenceConfirmed" aria-describedby="residenceConfirmed-error"/>
        <span>Oświadczam, że uczestnik mieszka w wybranej wyżej gminie. *</span>
      </label>
      <Err name="residenceConfirmed" errors={errors}/>
    </fieldset>

    <fieldset disabled={sending}>
      <legend>2. Regularne zajęcia</legend>
      <p className={styles.fieldHint}>Priorytet udziału mają osoby biorące udział w regularnych zajęciach „Kreatorów Przyszłości”.</p>
      <div role="radiogroup" aria-labelledby="regular-label" aria-describedby="regularParticipant-error">
        <p id="regular-label"><strong>Czy uczestnik bierze udział w regularnych zajęciach Kreatorów Przyszłości? *</strong></p>
        <div className={styles.choices}>
          <label><input type="radio" name="regularParticipant" checked={regular === 'yes'} onChange={() => setRegular('yes')}/> Tak</label>
          <label><input type="radio" name="regularParticipant" checked={regular === 'no'} onChange={() => { setRegular('no'); setGroups([]) }}/> Nie</label>
        </div>
      </div>
      <Err name="regularParticipant" errors={errors}/>

      {regular === 'yes' && <>
        <p className={styles.fieldHint}>Zaznacz grupę lub grupy, w których uczestnik bierze udział.</p>
        {participantAge == null && <p className={styles.fieldHint}>Najpierw podaj datę urodzenia w punkcie 1, aby zaznaczyć grupy odpowiednie dla wieku uczestnika.</p>}
        {projectSchedule.map(location => <section key={location.municipality} className={styles.groupLocation} aria-labelledby={`winter-groups-${location.municipality}`}>
          <header><h3 id={`winter-groups-${location.municipality}`}>{location.name} · {location.day}</h3></header>
          <div className={styles.courseGrid}>{foundationGroupOptions.filter(group => group.municipality === location.municipality).map(group => {
            const eligible = participantAge != null && participantAge >= group.minAge && participantAge <= group.maxAge
            return <label key={group.id} className={`${styles.course} ${eligible ? '' : styles.disabled}`}>
              <input
                type="checkbox"
                name="regularGroups"
                value={group.id}
                aria-label={`${group.label}, ${group.age}`}
                disabled={!eligible}
                checked={groups.includes(group.id)}
                onChange={event => setGroups(current => event.target.checked ? [...current, group.id] : current.filter(id => id !== group.id))}
              />
              <span>
                <strong>{group.title}</strong>
                <small>{group.age} · {group.time ? `godz. ${group.time}` : 'godzina do potwierdzenia'}</small>
              </span>
            </label>
          })}</div>
        </section>)}
        <Err name="regularGroups" errors={errors}/>
      </>}
    </fieldset>

    <fieldset disabled={sending}>
      <legend>3. Kontakt i potrzeby</legend>
      <label>Imię i nazwisko rodzica, opiekuna lub pełnoletniego uczestnika *
        <input name="contactName" autoComplete="name" maxLength={120} aria-invalid={Boolean(errors.contactName)} aria-describedby="contactName-error"/>
        <Err name="contactName" errors={errors}/>
      </label>
      <div className={styles.cols}>
        <label>Adres e-mail *
          <input name="email" type="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby="email-error"/>
          <Err name="email" errors={errors}/>
        </label>
        <label>Numer telefonu *
          <input name="phone" type="tel" autoComplete="tel" placeholder="666 661 750 lub +48…" aria-invalid={Boolean(errors.phone)} aria-describedby="phone-error"/>
          <Err name="phone" errors={errors}/>
        </label>
      </div>
      <label>Szczególne potrzeby organizacyjne i komunikacyjne <span className={styles.optional}>(opcjonalnie)</span>
        <textarea name="specialNeeds" maxLength={1500} rows={4} aria-describedby="needs-hint"/>
        <small id="needs-hint">Napisz, co pomoże uczestnikowi czuć się bezpiecznie i swobodnie. Nie podawaj szczegółowych danych medycznych.</small>
      </label>
    </fieldset>

    <fieldset disabled={sending}>
      <legend>4. Deklaracje i zgody</legend>
      <div>
        <label className={styles.consent}>
          <input type="checkbox" name="attendanceDeclaration" aria-describedby="attendanceDeclaration-error"/>
          <span>Deklaruję regularny udział uczestnika we wszystkich dniach Winter Project Week ({WINTER.dateLabel}, codziennie {WINTER.hours}). *</span>
        </label>
        <Err name="attendanceDeclaration" errors={errors}/>
      </div>
      <div>
        <label className={styles.consent}>
          <input type="checkbox" name="rulesAccepted" aria-describedby="rulesAccepted-error"/>
          <span>Akceptuję zasady projektu opisane w sekcji „Warunki uczestnictwa” na tej stronie. Rozumiem, że wysłanie formularza nie gwarantuje miejsca. *</span>
        </label>
        <Err name="rulesAccepted" errors={errors}/>
      </div>
      <div>
        <label className={styles.consent}>
          <input type="checkbox" name="consentContact" aria-describedby="consentContact-error"/>
          <span>Wyrażam zgodę na kontakt telefoniczny, SMS, WhatsApp lub e-mail przez uNick Academy Foundation wyłącznie w sprawie Winter Project Week i projektu „Kreatorzy Przyszłości”. Wiem, że zgodę mogę wycofać w dowolnym momencie. *</span>
        </label>
        <Err name="consentContact" errors={errors}/>
      </div>
      <div>
        <label className={styles.consent}>
          <input type="checkbox" name="privacyAcknowledged" aria-describedby="privacyAcknowledged-error"/>
          <span>Wyrażam zgodę na przetwarzanie danych podanych w formularzu w celu obsługi zgłoszenia i kontaktu dotyczącego udziału. <Link href="/pl/foundation/ferie-dane" target="_blank">Przeczytaj informację o przetwarzaniu danych</Link> *</span>
        </label>
        <Err name="privacyAcknowledged" errors={errors}/>
      </div>
    </fieldset>

    <Button href={null} type="submit" fullWidth disabled={sending}>{sending ? 'Wysyłanie…' : 'Zgłoś udział w Winter Project Week'}</Button>
  </form>
}
