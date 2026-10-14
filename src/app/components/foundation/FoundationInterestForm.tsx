/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import Link from 'next/link'
import {FormEvent, useEffect, useRef, useState} from 'react'
import Button from '../Button'
import * as O from '@/lib/foundation/options'
import {validateFoundationInterest} from '@/lib/foundation/validation'
import styles from './FoundationInterestForm.module.css'

type Props = {copy: any; locale: string}
type Errors = Record<string, string>

const Err = ({name, errors}: {name: string; errors: Errors}) => errors[name]
  ? <p id={`${name}-error`} className={styles.error}>{errors[name]}</p>
  : null

const CheckboxChoices = ({name, options, selected, onChange}: {
  name: string
  options: readonly {value: string; label: string}[]
  selected: string[]
  onChange: (values: string[]) => void
}) => <div className={styles.choices}>{options.map(option => <label key={option.value}>
  <input
    type="checkbox"
    name={name}
    value={option.value}
    checked={selected.includes(option.value)}
    onChange={event => onChange(event.target.checked
      ? [...selected, option.value]
      : selected.filter(value => value !== option.value))}
  />
  <span>{option.label}</span>
</label>)}</div>

export default function FoundationInterestForm({copy, locale}: Props) {
  const startedAt = useRef(0)
  const errorSummary = useRef<HTMLDivElement>(null)
  const [birthDate, setBirthDate] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [activities, setActivities] = useState<string[]>([])
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const participantAge = O.calculateAgeOnDate(birthDate)

  useEffect(() => { startedAt.current = Date.now() }, [])

  const keepEligibleActivities = (nextBirthDate: string, nextMunicipality: string) => {
    const nextAge = O.calculateAgeOnDate(nextBirthDate)
    const eligible = nextAge == null
      ? []
      : O.activitiesForParticipant(nextAge, nextMunicipality).map(activity => activity.value)
    setActivities(current => current.filter(value => eligible.includes(value as never)))
  }

  const readChecks = (form: FormData, name: string) => form.getAll(name).map(String)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      participantFirstName: form.get('participantFirstName'),
      birthDate: form.get('birthDate'),
      municipality: form.get('municipality'),
      residenceConfirmed: form.get('residenceConfirmed') === 'on',
      activities: readChecks(form, 'activities'),
      primaryActivity: form.get('primaryActivity'),
      availableDays: readChecks(form, 'availableDays'),
      timeSlots: readChecks(form, 'timeSlots'),
      organizationalNeeds: form.get('organizationalNeeds'),
      contactName: form.get('contactName'),
      email: form.get('email'),
      phone: form.get('phone'),
      consentDeclaration: form.get('consentDeclaration') === 'on',
      consentContact: form.get('consentContact') === 'on',
      privacyAcknowledged: form.get('privacyAcknowledged') === 'on',
      uniBallPotwierdzenie: form.get('uniBallPotwierdzenie'),
      startedAt: startedAt.current,
    }
    const validation = validateFoundationInterest(payload)
    if (!validation.ok) {
      setErrors(validation.errors)
      requestAnimationFrame(() => errorSummary.current?.focus())
      return
    }

    setSending(true)
    setErrors({})
    try {
      const response = await fetch('/api/foundation-interest', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setErrors(result.errors || {form: result.error || copy.genericError})
        requestAnimationFrame(() => errorSummary.current?.focus())
      } else {
        setDone(true)
      }
    } catch {
      setErrors({form: copy.genericError})
      requestAnimationFrame(() => errorSummary.current?.focus())
    } finally {
      setSending(false)
    }
  }

  const availabilityReason = (activity: typeof O.activityOptions[number]) => {
    if (participantAge == null && !municipality) return 'Najpierw podaj datę urodzenia i gminę.'
    if (participantAge == null) return 'Najpierw podaj datę urodzenia.'
    if (!municipality) return 'Najpierw wybierz gminę.'
    if (participantAge < activity.minAge || participantAge > activity.maxAge) {
      return `Dostępne dla osób w wieku ${activity.minAge}–${activity.maxAge} lat.`
    }
    const municipalities: readonly string[] = activity.municipalities
    if (!municipalities.includes(municipality)) {
      return 'Te zajęcia nie są dostępne w wybranej gminie.'
    }
    return 'Dostępne dla tego wieku i gminy.'
  }

  if (done) return <div className={`${styles.shell} ${styles.success}`} role="status" aria-live="polite">
    <span className={styles.successMark} aria-hidden="true">✓</span>
    <h3>{copy.successTitle}</h3>
    <p>{copy.successText}</p>
  </div>

  return <form className={styles.shell} onSubmit={submit} noValidate aria-busy={sending}>
    <p className={styles.requiredHint}>{copy.requiredHint}</p>
    {Object.keys(errors).length > 0 && <div ref={errorSummary} tabIndex={-1} role="alert" className={styles.summary}>
      <h3>{copy.errorTitle}</h3>
      <ul>{Object.values(errors).map(error => <li key={error}>{error}</li>)}</ul>
    </div>}

    {/* Pułapka na boty. Nazwa celowo bez znaczenia — pole „website” było
        autouzupełniane przez przeglądarki i odrzucało prawdziwe zgłoszenia. */}
    <div className={styles.honey} aria-hidden="true">
      <input name="uniBallPotwierdzenie" tabIndex={-1} autoComplete="off" data-1p-ignore="true" data-lpignore="true" data-form-type="other"/>
    </div>

    <fieldset disabled={sending}>
      <legend>1. Uczestnik</legend>
      <div className={styles.cols}>
        <label>Imię i nazwisko uczestnika *
          <input name="participantFirstName" maxLength={80} autoComplete="name" aria-invalid={Boolean(errors.participantFirstName)} aria-describedby="participantFirstName-error"/>
          <Err name="participantFirstName" errors={errors}/>
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
              const value = event.target.value
              setBirthDate(value)
              keepEligibleActivities(value, municipality)
            }}
          />
          <small id="birth-date-hint">Na potrzeby doboru zajęć wiek liczymy na 1 listopada 2026 r.{participantAge != null && ` Wtedy uczestnik będzie mieć ${participantAge} lat.`}</small>
          <Err name="birthDate" errors={errors}/>
        </label>
      </div>

      <label>Gmina zamieszkania *
        <select
          name="municipality"
          value={municipality}
          aria-invalid={Boolean(errors.municipality)}
          aria-describedby="municipality-error"
          onChange={event => {
            const value = event.target.value
            setMunicipality(value)
            keepEligibleActivities(birthDate, value)
          }}
        >
          <option value="">Wybierz gminę</option>
          {O.municipalityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <Err name="municipality" errors={errors}/>
      </label>

      <label className={styles.consent}>
        <input type="checkbox" name="residenceConfirmed" aria-describedby="residenceConfirmed-error"/>
        <span>Potwierdzam, że uczestnik mieszka w wybranej wyżej gminie. *</span>
      </label>
      <Err name="residenceConfirmed" errors={errors}/>
    </fieldset>

    <fieldset disabled={sending}>
      <legend>2. Zajęcia</legend>
      <p className={styles.fieldHint}>Możesz wybrać więcej niż jedną opcję. Formularz od razu uwzględnia wiek i gminę.</p>
      <div className={styles.courseGrid}>{O.activityOptions.map(activity => {
        const eligible = participantAge != null
          && O.activitiesForParticipant(participantAge, municipality).some(option => option.value === activity.value)
        return <label key={activity.value} className={`${styles.course} ${eligible ? '' : styles.disabled}`}>
          <input
            type="checkbox"
            name="activities"
            value={activity.value}
            disabled={!eligible}
            checked={activities.includes(activity.value)}
            onChange={event => setActivities(current => event.target.checked
              ? [...current, activity.value]
              : current.filter(value => value !== activity.value))}
          />
          <span><strong>{activity.label}</strong><small>{availabilityReason(activity)}</small></span>
        </label>
      })}</div>
      <Err name="activities" errors={errors}/>

      <label>Pierwszy wybór *
        <select name="primaryActivity" aria-invalid={Boolean(errors.primaryActivity)} aria-describedby="primaryActivity-error">
          <option value="">Wybierz</option>
          {O.activityOptions.filter(option => activities.includes(option.value)).map(option =>
            <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <Err name="primaryActivity" errors={errors}/>
      </label>
    </fieldset>

    <fieldset disabled={sending}>
      <legend>3. Kiedy możecie?</legend>
      <p className={styles.fieldHint}>To pomoże nam ułożyć grupy. Na tym etapie nie wybierasz jeszcze ostatecznego terminu.</p>
      <label className={styles.label}>Preferowane dni *</label>
      <CheckboxChoices name="availableDays" options={O.dayOptions} selected={availableDays} onChange={setAvailableDays}/>
      <Err name="availableDays" errors={errors}/>
      <label className={styles.label}>Możliwe godziny *</label>
      <CheckboxChoices name="timeSlots" options={O.timeSlotOptions} selected={timeSlots} onChange={setTimeSlots}/>
      <Err name="timeSlots" errors={errors}/>
    </fieldset>

    <fieldset disabled={sending}>
      <legend>4. Kontakt i dostępność</legend>
      <label>Imię i nazwisko rodzica lub opiekuna *
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
      <label>Potrzeby szczególne lub dotyczące dostępności <span className={styles.optional}>(opcjonalnie)</span>
        <textarea name="organizationalNeeds" maxLength={1500} rows={4} aria-describedby="needs-hint"/>
        <small id="needs-hint">Napisz, co pomoże uczestnikowi czuć się bezpiecznie i swobodnie. Nie podawaj szczegółowych danych medycznych.</small>
      </label>
    </fieldset>

    <fieldset disabled={sending}>
      <legend>5. Potwierdzenia i zgody</legend>
      {['consentDeclaration', 'consentContact', 'privacyAcknowledged'].map((name, index) => <div key={name}>
        <label className={styles.consent}>
          <input type="checkbox" name={name} aria-describedby={`${name}-error`}/>
          <span>{copy.consents[index]} {index === 2 && <Link href={`/${locale}/foundation/privacy`} target="_blank">Przeczytaj informację o przetwarzaniu danych</Link>} *</span>
        </label>
        <Err name={name} errors={errors}/>
      </div>)}
    </fieldset>

    <Button href={null} type="submit" fullWidth disabled={sending}>{sending ? copy.submitting : copy.submit}</Button>
  </form>
}
