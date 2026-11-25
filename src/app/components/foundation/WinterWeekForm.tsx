'use client'

import Link from 'next/link'
import {FormEvent, useEffect, useRef, useState} from 'react'
import Button from '../Button'
import * as O from '@/lib/foundation/options'
import {projectSchedule} from '@/lib/foundation/schedule'
import {foundationGroupOptions} from '@/lib/foundation/groups'
import {validateWinterRegistration} from '@/lib/winter/validation'
import {WINTER} from '@/lib/winter/event'
import {ageLabel, dayLabel, errorLabel, groupLabel, placeLabel, type FoundationLocale} from '@/lib/foundation/i18n'
import styles from './FoundationInterestForm.module.css'

const TEXT = {
  pl: {
    sendError: (email: string) => `Nie udało się wysłać zgłoszenia. Spróbuj ponownie lub napisz na ${email}.`,
    thanks: 'Dziękujemy, zgłoszenie jest zapisane', refLabel: 'Numer zgłoszenia:',
    thanksText: 'Wysłaliśmy potwierdzenie na podany adres e-mail. Wysłanie formularza nie gwarantuje miejsca. Skontaktujemy się w sprawie potwierdzenia udziału.',
    required: 'Pola oznaczone * są wymagane.', check: 'Sprawdź formularz',
    participant: '1. Uczestnik', participantName: 'Imię i nazwisko uczestnika *', birthDate: 'Data urodzenia *',
    ageHint: (age: number | null) => `Wiek liczymy na 1 listopada 2026 r., tak samo jak w zajęciach regularnych.${age != null ? ` Wtedy uczestnik będzie mieć ${age} lat.` : ''}`,
    municipality: 'Gmina zamieszkania *', chooseMunicipality: 'Wybierz gminę',
    residence: 'Oświadczam, że uczestnik mieszka w wybranej wyżej gminie. *',
    regular: '2. Regularne zajęcia', priority: 'Priorytet udziału mają osoby biorące udział w regularnych zajęciach „Kreatorów Przyszłości”.',
    regularQ: 'Czy uczestnik bierze udział w regularnych zajęciach Kreatorów Przyszłości? *', yes: 'Tak', no: 'Nie',
    pickGroups: 'Zaznacz grupę lub grupy, w których uczestnik bierze udział.',
    birthFirst: 'Najpierw podaj datę urodzenia w punkcie 1, aby zaznaczyć grupy odpowiednie dla wieku uczestnika.',
    at: 'godz. ', timePending: 'godzina do potwierdzenia',
    contact: '3. Kontakt i potrzeby', contactName: 'Imię i nazwisko rodzica, opiekuna lub pełnoletniego uczestnika *', email: 'Adres e-mail *', phone: 'Numer telefonu *',
    phonePlaceholder: '666 661 750 lub +48…', needs: 'Szczególne potrzeby organizacyjne i komunikacyjne', optional: '(opcjonalnie)',
    needsHint: 'Napisz, co pomoże uczestnikowi czuć się bezpiecznie i swobodnie. Nie podawaj szczegółowych danych medycznych.',
    declarations: '4. Deklaracje i zgody',
    attendance: (date: string, hours: string) => `Deklaruję regularny udział uczestnika we wszystkich dniach Winter Project Week (${date}, codziennie ${hours}). *`,
    rules: 'Akceptuję zasady projektu opisane w sekcji „Warunki uczestnictwa” na tej stronie. Rozumiem, że wysłanie formularza nie gwarantuje miejsca. *',
    contactConsent: 'Wyrażam zgodę na kontakt telefoniczny, SMS, WhatsApp lub e-mail przez uNick Academy Foundation wyłącznie w sprawie Winter Project Week i projektu „Kreatorzy Przyszłości”. Wiem, że zgodę mogę wycofać w dowolnym momencie. *',
    privacyConsent: 'Wyrażam zgodę na przetwarzanie danych podanych w formularzu w celu obsługi zgłoszenia i kontaktu dotyczącego udziału.',
    privacyLink: 'Przeczytaj informację o przetwarzaniu danych', privacyHref: '/pl/foundation/ferie-dane',
    submit: 'Zgłoś udział w Winter Project Week', sending: 'Wysyłanie…',
  },
  en: {
    sendError: (email: string) => `We could not send your submission. Please try again or write to ${email}.`,
    thanks: 'Thank you, your submission has been saved', refLabel: 'Submission number:',
    thanksText: 'We have sent a confirmation to the email address you provided. Submitting the form does not guarantee a place. We will contact you to confirm participation.',
    required: 'Fields marked * are required.', check: 'Please check the form',
    participant: '1. Participant', participantName: "Participant's first and last name *", birthDate: 'Date of birth *',
    ageHint: (age: number | null) => `Age is calculated as of 1 November 2026, the same as for the regular classes.${age != null ? ` The participant will then be ${age} years old.` : ''}`,
    municipality: 'Municipality of residence *', chooseMunicipality: 'Choose a municipality',
    residence: 'I declare that the participant lives in the municipality chosen above. *',
    regular: '2. Regular classes', priority: 'Priority is given to participants of the regular Creators of the Future classes.',
    regularQ: 'Does the participant attend the regular Creators of the Future classes? *', yes: 'Yes', no: 'No',
    pickGroups: 'Select the group or groups the participant attends.',
    birthFirst: "First enter the date of birth in section 1 to select groups suitable for the participant's age.",
    at: 'at ', timePending: 'time to be confirmed',
    contact: '3. Contact and needs', contactName: 'First and last name of the parent, guardian or adult participant *', email: 'Email address *', phone: 'Phone number *',
    phonePlaceholder: '666 661 750 or +48…', needs: 'Special organisational and communication needs', optional: '(optional)',
    needsHint: 'Tell us what will help the participant feel safe and comfortable. Please do not include detailed medical information.',
    declarations: '4. Declarations and consents',
    attendance: (date: string, hours: string) => `I declare regular attendance of the participant on all days of Winter Project Week (${date}, daily ${hours}). *`,
    rules: 'I accept the project rules described in the "Conditions of participation" section on this page. I understand that submitting the form does not guarantee a place. *',
    contactConsent: 'I consent to contact by phone, SMS, WhatsApp or email from uNick Academy Foundation solely regarding Winter Project Week and the Creators of the Future project. I know I can withdraw my consent at any time. *',
    privacyConsent: 'I consent to the processing of the data provided in the form for the purpose of handling the submission and contact regarding participation.',
    privacyLink: 'Read the personal data processing information', privacyHref: '/en/foundation/ferie-dane',
    submit: 'Sign up for Winter Project Week', sending: 'Sending…',
  },
} as const

type Errors = Record<string, string>

const Err = ({name, errors}: {name: string; errors: Errors}) => errors[name]
  ? <p id={`${name}-error`} className={styles.error}>{errors[name]}</p>
  : null

export default function WinterWeekForm({locale: rawLocale = 'pl'}: {locale?: string}) {
  const locale: FoundationLocale = rawLocale === 'en' ? 'en' : 'pl'
  const t = TEXT[locale]
  const dateLabel = locale === 'en' ? '22–26 February 2027' : WINTER.dateLabel
  const translateErrors = (errs: Errors): Errors =>
    Object.fromEntries(Object.entries(errs).map(([key, message]) => [key, errorLabel(message, locale)]))
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
      setErrors(translateErrors(validation.errors))
      requestAnimationFrame(() => errorSummary.current?.focus())
      return
    }

    setSending(true)
    setErrors({})
    try {
      const response = await fetch('/api/winter-week', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...payload, locale}),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setErrors(result.errors ? translateErrors(result.errors) : {form: result.error ? errorLabel(result.error, locale) : t.sendError(WINTER.contactEmail)})
        requestAnimationFrame(() => errorSummary.current?.focus())
      } else {
        setReference(result.reference || '')
      }
    } catch {
      setErrors({form: t.sendError(WINTER.contactEmail)})
      requestAnimationFrame(() => errorSummary.current?.focus())
    } finally {
      setSending(false)
    }
  }

  if (reference !== null) return <div className={`${styles.shell} ${styles.success}`} role="status" aria-live="polite">
    <span className={styles.successMark} aria-hidden="true">✓</span>
    <h3>{t.thanks}</h3>
    <p>{t.refLabel} <strong>{reference}</strong>. {t.thanksText}</p>
  </div>

  return <form className={styles.shell} onSubmit={submit} noValidate aria-busy={sending}>
    <p className={styles.requiredHint}>{t.required}</p>
    {Object.keys(errors).length > 0 && <div ref={errorSummary} tabIndex={-1} role="alert" className={styles.summary}>
      <h3>{t.check}</h3>
      <ul>{Object.values(errors).map(error => <li key={error}>{error}</li>)}</ul>
    </div>}

    <fieldset disabled={sending}>
      <legend>{t.participant}</legend>
      <div className={styles.cols}>
        <label>{t.participantName}
          <input name="participantName" maxLength={120} autoComplete="off" aria-invalid={Boolean(errors.participantName)} aria-describedby="participantName-error"/>
          <Err name="participantName" errors={errors}/>
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
              setBirthDate(event.target.value)
              keepEligibleGroups(event.target.value)
            }}
          />
          <small id="birth-date-hint">{t.ageHint(participantAge)}</small>
          <Err name="birthDate" errors={errors}/>
        </label>
      </div>

      <label>{t.municipality}
        <select name="municipality" defaultValue="" aria-invalid={Boolean(errors.municipality)} aria-describedby="municipality-error">
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
      <legend>{t.regular}</legend>
      <p className={styles.fieldHint}>{t.priority}</p>
      <div role="radiogroup" aria-labelledby="regular-label" aria-describedby="regularParticipant-error">
        <p id="regular-label"><strong>{t.regularQ}</strong></p>
        <div className={styles.choices}>
          <label><input type="radio" name="regularParticipant" checked={regular === 'yes'} onChange={() => setRegular('yes')}/> {t.yes}</label>
          <label><input type="radio" name="regularParticipant" checked={regular === 'no'} onChange={() => { setRegular('no'); setGroups([]) }}/> {t.no}</label>
        </div>
      </div>
      <Err name="regularParticipant" errors={errors}/>

      {regular === 'yes' && <>
        <p className={styles.fieldHint}>{t.pickGroups}</p>
        {participantAge == null && <p className={styles.fieldHint}>{t.birthFirst}</p>}
        {projectSchedule.map(location => <section key={location.municipality} className={styles.groupLocation} aria-labelledby={`winter-groups-${location.municipality}`}>
          <header><h3 id={`winter-groups-${location.municipality}`}>{placeLabel(location.name, locale)} · {dayLabel(location.day, locale)}</h3></header>
          <div className={styles.courseGrid}>{foundationGroupOptions.filter(group => group.municipality === location.municipality).map(group => {
            const eligible = participantAge != null && participantAge >= group.minAge && participantAge <= group.maxAge
            return <label key={group.id} className={`${styles.course} ${eligible ? '' : styles.disabled}`}>
              <input
                type="checkbox"
                name="regularGroups"
                value={group.id}
                aria-label={`${groupLabel(group, location, locale) ?? group.label}, ${ageLabel(group.age, locale)}`}
                disabled={!eligible}
                checked={groups.includes(group.id)}
                onChange={event => setGroups(current => event.target.checked ? [...current, group.id] : current.filter(id => id !== group.id))}
              />
              <span>
                <strong>{group.title}</strong>
                <small>{ageLabel(group.age, locale)} · {group.time ? `${t.at}${group.time}` : t.timePending}</small>
              </span>
            </label>
          })}</div>
        </section>)}
        <Err name="regularGroups" errors={errors}/>
      </>}
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
        <textarea name="specialNeeds" maxLength={1500} rows={4} aria-describedby="needs-hint"/>
        <small id="needs-hint">{t.needsHint}</small>
      </label>
    </fieldset>

    <fieldset disabled={sending}>
      <legend>{t.declarations}</legend>
      <div>
        <label className={styles.consent}>
          <input type="checkbox" name="attendanceDeclaration" aria-describedby="attendanceDeclaration-error"/>
          <span>{t.attendance(dateLabel, WINTER.hours)}</span>
        </label>
        <Err name="attendanceDeclaration" errors={errors}/>
      </div>
      <div>
        <label className={styles.consent}>
          <input type="checkbox" name="rulesAccepted" aria-describedby="rulesAccepted-error"/>
          <span>{t.rules}</span>
        </label>
        <Err name="rulesAccepted" errors={errors}/>
      </div>
      <div>
        <label className={styles.consent}>
          <input type="checkbox" name="consentContact" aria-describedby="consentContact-error"/>
          <span>{t.contactConsent}</span>
        </label>
        <Err name="consentContact" errors={errors}/>
      </div>
      <div>
        <label className={styles.consent}>
          <input type="checkbox" name="privacyAcknowledged" aria-describedby="privacyAcknowledged-error"/>
          <span>{t.privacyConsent} <Link href={t.privacyHref} target="_blank">{t.privacyLink}</Link> *</span>
        </label>
        <Err name="privacyAcknowledged" errors={errors}/>
      </div>
    </fieldset>

    <Button href={null} type="submit" fullWidth disabled={sending}>{sending ? t.sending : t.submit}</Button>
  </form>
}
