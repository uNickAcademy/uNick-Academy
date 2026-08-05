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

const Choice = ({name, options, type = 'radio'}: {
  name: string
  options: readonly {value: string; label: string}[]
  type?: 'radio' | 'checkbox'
}) => <div className={styles.choices}>{options.map(option => <label key={option.value}>
  <input type={type} name={name} value={option.value}/>
  <span>{option.label}</span>
</label>)}</div>

const Err = ({name, errors}: {name: string; errors: Errors}) => errors[name]
  ? <p className={styles.error}>{errors[name]}</p>
  : null

export default function FoundationInterestForm({copy, locale}: Props) {
  const startedAt = useRef(0)
  const errorSummary = useRef<HTMLDivElement>(null)
  const [age, setAge] = useState('')
  const [activities, setActivities] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [motivations, setMotivations] = useState<string[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { startedAt.current = Date.now() }, [])

  const readChecks = (form: FormData, name: string) => form.getAll(name).map(String)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      respondentType: form.get('respondentType'),
      participantFirstName: form.get('participantFirstName'),
      participantAge: form.get('participantAge'),
      locality: form.get('locality'),
      activities: readChecks(form, 'activities'),
      primaryActivity: form.get('primaryActivity'),
      attendanceCommitment: form.get('attendanceCommitment'),
      preferredLocations: readChecks(form, 'preferredLocations'),
      primaryLocation: form.get('primaryLocation'),
      motivations: readChecks(form, 'motivations'),
      motivationOther: form.get('motivationOther'),
      organizationalNeeds: form.get('organizationalNeeds'),
      contactName: form.get('contactName'),
      email: form.get('email'),
      phone: form.get('phone'),
      consentDeclaration: form.get('consentDeclaration') === 'on',
      consentContact: form.get('consentContact') === 'on',
      privacyAcknowledged: form.get('privacyAcknowledged') === 'on',
      website: form.get('website'),
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
    } finally {
      setSending(false)
    }
  }

  if (done) return <div className={`${styles.shell} ${styles.success}`} role="status">
    <h3>{copy.successTitle}</h3>
    <p>{copy.successText}</p>
  </div>

  return <form className={styles.shell} onSubmit={submit} noValidate>
    <p>{copy.requiredHint}</p>
    {Object.keys(errors).length > 0 && <div ref={errorSummary} tabIndex={-1} role="alert" className={styles.summary}>
      <h3>{copy.errorTitle}</h3>
      <ul>{Object.values(errors).map(error => <li key={error}>{error}</li>)}</ul>
    </div>}
    <div className={styles.honey}><input name="website" tabIndex={-1} autoComplete="off"/></div>

    <fieldset>
      <legend>{copy.sections.participant}</legend>
      <label className={styles.label}>Kto wypełnia formularz? *</label>
      <Choice name="respondentType" options={O.respondentOptions}/>
      <Err name="respondentType" errors={errors}/>
      <div className={styles.cols}>
        <label>Imię uczestnika *
          <input name="participantFirstName" maxLength={80}/>
          <small>Bez nazwiska niepełnoletniego uczestnika.</small>
          <Err name="participantFirstName" errors={errors}/>
        </label>
        <label>Wiek uczestnika *
          <select name="participantAge" value={age} onChange={event => {
            const selectedAge = event.target.value
            setAge(selectedAge)
            setActivities(current => current.filter(id => O.activitiesForAge(Number(selectedAge)).some(option => option.value === id)))
          }}>
            <option value="">Wybierz</option>
            {Array.from({length: 10}, (_, index) => index + 9).map(value => <option key={value}>{value}</option>)}
          </select>
          <Err name="participantAge" errors={errors}/>
        </label>
      </div>
      <label>Miejscowość zamieszkania *
        <input name="locality" maxLength={120}/>
        <Err name="locality" errors={errors}/>
      </label>
    </fieldset>

    <fieldset>
      <legend>{copy.sections.preferences}</legend>
      <label className={styles.label}>Którymi zajęciami jest zainteresowany uczestnik? *</label>
      <div className={styles.choices}>{O.activityOptions.map(option => {
        const disabled = !age || Number(age) < option.minAge || Number(age) > option.maxAge
        return <label key={option.value} className={disabled ? styles.disabled : ''}>
          <input
            type="checkbox"
            name="activities"
            value={option.value}
            disabled={disabled}
            checked={activities.includes(option.value)}
            onChange={event => setActivities(current => event.target.checked
              ? [...current, option.value]
              : current.filter(value => value !== option.value))}
          />
          <span>{option.label}</span>
        </label>
      })}</div>
      <Err name="activities" errors={errors}/>
      <label>Pierwszy wybór *
        <select name="primaryActivity">
          <option value="">Wybierz</option>
          {O.activityOptions.filter(option => activities.includes(option.value)).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <Err name="primaryActivity" errors={errors}/>
      </label>
      <label className={styles.label}>Gotowość do regularnego udziału 15.10.2026–15.04.2027 *</label>
      <Choice name="attendanceCommitment" options={O.attendanceOptions}/>
      <Err name="attendanceCommitment" errors={errors}/>
      <label className={styles.label}>Co najbardziej zachęca uczestnika?</label>
      <div onChange={(event: any) => {
        if (event.target.name === 'motivations') setMotivations(current => event.target.checked
          ? [...current, event.target.value]
          : current.filter(value => value !== event.target.value))
      }}>
        <Choice name="motivations" options={O.motivationOptions} type="checkbox"/>
      </div>
      {motivations.includes('other') && <label>Inne
        <input name="motivationOther" maxLength={300}/>
        <Err name="motivationOther" errors={errors}/>
      </label>}
      <label>Uwagi
        <textarea name="organizationalNeeds" maxLength={1500} rows={5}/>
      </label>
    </fieldset>

    <fieldset>
      <legend>Lokalizacja</legend>
      <label className={styles.label}>Preferowane lokalizacje *</label>
      <div className={styles.choices}>{O.projectLocationOptions.map(option => <label key={option.value}>
        <input
          type="checkbox"
          name="preferredLocations"
          value={option.value}
          checked={locations.includes(option.value)}
          onChange={event => setLocations(current => event.target.checked
            ? [...current, option.value]
            : current.filter(value => value !== option.value))}
        />
        <span>{option.label}</span>
      </label>)}</div>
      <Err name="preferredLocations" errors={errors}/>
      <label>Pierwszy wybór lokalizacji *
        <select name="primaryLocation">
          <option value="">Wybierz</option>
          {O.projectLocationOptions.filter(option => locations.includes(option.value)).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <Err name="primaryLocation" errors={errors}/>
      </label>
    </fieldset>

    <fieldset>
      <legend>{copy.sections.contact}</legend>
      <label>Imię i nazwisko rodzica, opiekuna albo pełnoletniego uczestnika *
        <input name="contactName" autoComplete="name"/>
        <Err name="contactName" errors={errors}/>
      </label>
      <div className={styles.cols}>
        <label>Adres e-mail *
          <input name="email" type="email" autoComplete="email"/>
          <Err name="email" errors={errors}/>
        </label>
        <label>Numer telefonu *
          <input name="phone" type="tel" autoComplete="tel" placeholder="666 661 750 lub +48…"/>
          <Err name="phone" errors={errors}/>
        </label>
      </div>
    </fieldset>

    <fieldset>
      <legend>{copy.sections.consents}</legend>
      {['consentDeclaration', 'consentContact', 'privacyAcknowledged'].map((name, index) => <div key={name}>
        <label className={styles.consent}>
          <input type="checkbox" name={name}/>
          <span>{copy.consents[index]} {index === 2 && <Link href={`/${locale}/foundation/privacy`} target="_blank">{copy.privacyLink}</Link>} *</span>
        </label>
        <Err name={name} errors={errors}/>
      </div>)}
    </fieldset>
    <Button href={null} type="submit" fullWidth disabled={sending}>{sending ? copy.submitting : copy.submit}</Button>
  </form>
}
