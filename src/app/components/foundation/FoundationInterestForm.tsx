/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import Link from 'next/link'
import {FormEvent, useEffect, useRef, useState} from 'react'
import Button from '../Button'
import * as O from '@/lib/foundation/options'
import {projectSchedule} from '@/lib/foundation/schedule'
import {foundationGroupOptions, groupsForParticipant} from '@/lib/foundation/groups'
import {validateFoundationInterest} from '@/lib/foundation/validation'
import {ageLabel, dayLabel, errorLabel, groupLabel, placeLabel, venueLabel, type FoundationLocale} from '@/lib/foundation/i18n'
import styles from './FoundationInterestForm.module.css'

const TEXT = {
  pl: {
    participant: '1. Uczestnik', participantName: 'Imię i nazwisko uczestnika *', birthDate: 'Data urodzenia *',
    ageHint: (age: number | null) => `Na potrzeby doboru zajęć wiek liczymy na 1 listopada 2026 r.${age != null ? ` Wtedy uczestnik będzie mieć ${age} lat.` : ''}`,
    municipality: 'Gmina zamieszkania *', chooseMunicipality: 'Wybierz gminę',
    residence: 'Potwierdzam, że uczestnik mieszka w wybranej wyżej gminie. *',
    groups: '2. Zajęcia',
    groupsHint: 'Poniżej są wszystkie grupy. Możesz zaznaczyć więcej niż jedną — także w różnych gminach, niezależnie od miejsca zamieszkania.',
    birthFirst: 'Najpierw podaj datę urodzenia w punkcie 1, aby zaznaczyć grupy odpowiednie dla wieku uczestnika.',
    venuePending: 'Sala i dokładne godziny do potwierdzenia.', at: 'godz. ', timePending: 'godzina do potwierdzenia',
    primary: 'Pierwszy wybór *', primaryPlaceholder: 'Wybierz spośród zaznaczonych grup',
    contact: '3. Kontakt i dostępność', contactName: 'Imię i nazwisko rodzica lub opiekuna *', email: 'Adres e-mail *', phone: 'Numer telefonu *',
    phonePlaceholder: '666 661 750 lub +48…', needs: 'Potrzeby szczególne lub dotyczące dostępności', optional: '(opcjonalnie)',
    needsHint: 'Napisz, co pomoże uczestnikowi czuć się bezpiecznie i swobodnie. Nie podawaj szczegółowych danych medycznych.',
    consents: '4. Potwierdzenia i zgody', privacy: 'Przeczytaj informację o przetwarzaniu danych',
  },
  en: {
    participant: '1. Participant', participantName: "Participant's first and last name *", birthDate: 'Date of birth *',
    ageHint: (age: number | null) => `To match participants with classes, age is calculated as of 1 November 2026.${age != null ? ` The participant will then be ${age} years old.` : ''}`,
    municipality: 'Municipality of residence *', chooseMunicipality: 'Choose a municipality',
    residence: 'I confirm that the participant lives in the municipality chosen above. *',
    groups: '2. Classes',
    groupsHint: 'All groups are listed below. You can select more than one, including in different municipalities, regardless of where you live.',
    birthFirst: "First enter the date of birth in section 1 to select groups suitable for the participant's age.",
    venuePending: 'Venue and exact times to be confirmed.', at: 'at ', timePending: 'time to be confirmed',
    primary: 'First choice *', primaryPlaceholder: 'Choose from the selected groups',
    contact: '3. Contact and accessibility', contactName: "Parent's or guardian's first and last name *", email: 'Email address *', phone: 'Phone number *',
    phonePlaceholder: '666 661 750 or +48…', needs: 'Special or accessibility needs', optional: '(optional)',
    needsHint: 'Tell us what will help the participant feel safe and comfortable. Please do not include detailed medical information.',
    consents: '4. Confirmations and consents', privacy: 'Read the personal data processing information',
  },
} as const

type Props = {copy: any; locale: string}
type Errors = Record<string, string>

const Err = ({name, errors}: {name: string; errors: Errors}) => errors[name]
  ? <p id={`${name}-error`} className={styles.error}>{errors[name]}</p>
  : null

export default function FoundationInterestForm({copy, locale: rawLocale}: Props) {
  const locale: FoundationLocale = rawLocale === 'en' ? 'en' : 'pl'
  const t = TEXT[locale]
  const groupText = (group: typeof foundationGroupOptions[number]) => {
    const location = projectSchedule.find(item => item.municipality === group.municipality)
    return (location && groupLabel(group, location, locale)) || group.label
  }
  const startedAt = useRef(0)
  const errorSummary = useRef<HTMLDivElement>(null)
  const [birthDate, setBirthDate] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [primaryGroup, setPrimaryGroup] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const participantAge = O.calculateAgeOnDate(birthDate)

  useEffect(() => { startedAt.current = Date.now() }, [])

  const keepEligibleGroups = (nextBirthDate: string) => {
    const nextAge = O.calculateAgeOnDate(nextBirthDate)
    const eligible = nextAge == null
      ? []
      : groupsForParticipant(nextAge).map(group => group.id)
    setSelectedGroups(current => current.filter(value => eligible.includes(value)))
    setPrimaryGroup(current => eligible.includes(current) ? current : '')
  }

  const toggleGroup = (groupId: string, checked: boolean) => {
    const next = checked ? [...selectedGroups, groupId] : selectedGroups.filter(value => value !== groupId)
    setSelectedGroups(next)
    setPrimaryGroup(current => next.length === 1 ? next[0] : next.includes(current) ? current : '')
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
      selectedGroups: readChecks(form, 'selectedGroups'),
      primaryGroup: form.get('primaryGroup'),
      organizationalNeeds: form.get('organizationalNeeds'),
      contactName: form.get('contactName'),
      email: form.get('email'),
      phone: form.get('phone'),
      consentDeclaration: form.get('consentDeclaration') === 'on',
      consentContact: form.get('consentContact') === 'on',
      privacyAcknowledged: form.get('privacyAcknowledged') === 'on',
      startedAt: startedAt.current,
    }
    const validation = validateFoundationInterest(payload)
    if (!validation.ok) {
      setErrors(Object.fromEntries(Object.entries(validation.errors).map(([key, message]) => [key, errorLabel(message, locale)])))
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
        setErrors(result.errors
          ? Object.fromEntries(Object.entries(result.errors as Errors).map(([key, message]) => [key, errorLabel(message, locale)]))
          : {form: result.error ? errorLabel(result.error, locale) : copy.genericError})
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

    <fieldset disabled={sending}>
      <legend>{t.participant}</legend>
      <div className={styles.cols}>
        <label>{t.participantName}
          <input name="participantFirstName" maxLength={80} autoComplete="name" aria-invalid={Boolean(errors.participantFirstName)} aria-describedby="participantFirstName-error"/>
          <Err name="participantFirstName" errors={errors}/>
        </label>
        <label>{t.birthDate}
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
              keepEligibleGroups(value)
            }}
          />
          <small id="birth-date-hint">{t.ageHint(participantAge)}</small>
          <Err name="birthDate" errors={errors}/>
        </label>
      </div>

      <label>{t.municipality}
        <select
          name="municipality"
          value={municipality}
          aria-invalid={Boolean(errors.municipality)}
          aria-describedby="municipality-error"
          onChange={event => {
            const value = event.target.value
            setMunicipality(value)
          }}
        >
          <option value="">{t.chooseMunicipality}</option>
          {O.municipalityOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <Err name="municipality" errors={errors}/>
      </label>

      <label className={styles.consent}>
        <input type="checkbox" name="residenceConfirmed" aria-describedby="residenceConfirmed-error"/>
        <span>{t.residence}</span>
      </label>
      <Err name="residenceConfirmed" errors={errors}/>
    </fieldset>

    <fieldset disabled={sending}>
      <legend>{t.groups}</legend>
      <p className={styles.fieldHint}>{t.groupsHint}</p>
      {participantAge == null && <p className={styles.fieldHint}>{t.birthFirst}</p>}
      {projectSchedule.map(location => <section key={location.municipality} className={styles.groupLocation} aria-labelledby={`groups-${location.municipality}`}>
        <header>
          <h3 id={`groups-${location.municipality}`}>{placeLabel(location.name, locale)} · {dayLabel(location.day, locale)}</h3>
          <p>{location.address
            ? [location.venue && venueLabel(location.venue, locale), location.address].filter(Boolean).join(', ')
            : t.venuePending}</p>
        </header>
        <div className={styles.courseGrid}>{foundationGroupOptions.filter(group => group.municipality === location.municipality).map(group => {
          const eligible = participantAge != null && participantAge >= group.minAge && participantAge <= group.maxAge
          return <label key={group.id} className={`${styles.course} ${eligible ? '' : styles.disabled}`}>
            <input
              type="checkbox"
              name="selectedGroups"
              value={group.id}
              aria-label={`${groupText(group)}, ${ageLabel(group.age, locale)}`}
              disabled={!eligible}
              checked={selectedGroups.includes(group.id)}
              onChange={event => toggleGroup(group.id, event.target.checked)}
            />
            <span>
              <strong>{group.title}</strong>
              <small>{ageLabel(group.age, locale)} · {group.time ? `${t.at}${group.time}` : t.timePending}</small>
            </span>
          </label>
        })}</div>
      </section>)}
      <Err name="selectedGroups" errors={errors}/>

      <label>{t.primary}
        <select name="primaryGroup" value={primaryGroup} onChange={event => setPrimaryGroup(event.target.value)} aria-invalid={Boolean(errors.primaryGroup)} aria-describedby="primaryGroup-error">
          <option value="">{t.primaryPlaceholder}</option>
          {foundationGroupOptions.filter(group => selectedGroups.includes(group.id)).map(group =>
            <option key={group.id} value={group.id}>{groupText(group)}</option>)}
        </select>
        <Err name="primaryGroup" errors={errors}/>
      </label>
    </fieldset>

    <fieldset disabled={sending}>
      <legend>{t.contact}</legend>
      <label>{t.contactName}
        <input name="contactName" autoComplete="name" maxLength={120} aria-invalid={Boolean(errors.contactName)} aria-describedby="contactName-error"/>
        <Err name="contactName" errors={errors}/>
      </label>
      <div className={styles.cols}>
        <label>{t.email}
          <input name="email" type="email" autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby="email-error"/>
          <Err name="email" errors={errors}/>
        </label>
        <label>{t.phone}
          <input name="phone" type="tel" autoComplete="tel" placeholder={t.phonePlaceholder} aria-invalid={Boolean(errors.phone)} aria-describedby="phone-error"/>
          <Err name="phone" errors={errors}/>
        </label>
      </div>
      <label>{t.needs} <span className={styles.optional}>{t.optional}</span>
        <textarea name="organizationalNeeds" maxLength={1500} rows={4} aria-describedby="needs-hint"/>
        <small id="needs-hint">{t.needsHint}</small>
      </label>
    </fieldset>

    <fieldset disabled={sending}>
      <legend>{t.consents}</legend>
      {['consentDeclaration', 'consentContact', 'privacyAcknowledged'].map((name, index) => <div key={name}>
        <label className={styles.consent}>
          <input type="checkbox" name={name} aria-describedby={`${name}-error`}/>
          <span>{copy.consents[index]} {index === 2 && <Link href={`/${locale}/foundation/privacy`} target="_blank">{t.privacy}</Link>} *</span>
        </label>
        <Err name={name} errors={errors}/>
      </div>)}
    </fieldset>

    <Button href={null} type="submit" fullWidth disabled={sending}>{sending ? copy.submitting : copy.submit}</Button>
  </form>
}
