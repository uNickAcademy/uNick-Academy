'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import Button from '../Button'
import UNickorn from '../UNickorn'
import TimeRangeSlider from './TimeRangeSlider'
import * as O from '@/lib/availability/options'
import {
  DAYS,
  DEFAULT_SLOT,
  MAX_MINUTES,
  MAX_SLOTS_PER_DAY,
  MIN_MINUTES,
  formatSlot,
  type DayKey,
  type TimeSlot,
} from '@/lib/availability/schedule'
import { validateAvailabilitySubmission } from '@/lib/availability/validation'
import { trackConversion } from '@/lib/analytics/track'
import styles from './AvailabilityForm.module.css'

type EditableSlot = TimeSlot & { id: string }
type SlotsByDay = Record<DayKey, EditableSlot[]>
type Errors = Record<string, string>

const emptySlots = (): SlotsByDay =>
  DAYS.reduce((acc, day) => {
    acc[day.key] = []
    return acc
  }, {} as SlotsByDay)

// Kod z linku ?ref= to tylko wartość startowa — pole zostaje edytowalne, tak
// samo jak w ConsultationModal.tsx (większość poleceń dzieje się ustnie).
function readReferralCodeFromUrl(): string {
  if (typeof window === 'undefined') return ''
  try {
    return new URLSearchParams(window.location.search).get('ref') || ''
  } catch {
    return ''
  }
}

/**
 * Kolejne okno tego samego dnia proponujemy PO już zaznaczonych, żeby rodzic
 * nie musiał najpierw rozsuwać dwóch nakładających się suwaków.
 */
function suggestSlot(existing: EditableSlot[]): TimeSlot {
  if (!existing.length) return { ...DEFAULT_SLOT }

  const latestEnd = Math.max(...existing.map((slot) => slot.end))
  const start = latestEnd + 30
  if (start + 90 <= MAX_MINUTES) return { start, end: start + 90 }

  // Dzień jest już zajęty do wieczora — proponujemy okno przed pierwszym.
  const earliestStart = Math.min(...existing.map((slot) => slot.start))
  if (earliestStart - 120 >= MIN_MINUTES) {
    return { start: earliestStart - 120, end: earliestStart - 30 }
  }
  return { ...DEFAULT_SLOT }
}

export default function AvailabilityForm({ locale }: { locale: string }) {
  const summaryRef = useRef<HTMLDivElement>(null)
  const slotId = useRef(0)
  const startedAt = useRef(0)

  const [learnerType, setLearnerType] = useState<'' | 'self' | 'child'>('')
  const [modes, setModes] = useState<string[]>([])
  const [classFormats, setClassFormats] = useState<string[]>([])
  const [slots, setSlots] = useState<SlotsByDay>(emptySlots)
  const [referralCode, setReferralCode] = useState(() => readReferralCodeFromUrl())
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  // „W szkole dziecka” nie ma sensu przy zgłoszeniu „dla mnie” — nie ma
  // czyjejś szkoły, do której miałby dojechać nauczyciel.
  const formatOptions = O.formatOptionsFor(modes).filter(
    (option) => learnerType !== 'self' || option.value !== O.FORMAT_NEEDING_SCHOOL
  )
  const needsAddress = classFormats.includes(O.FORMAT_NEEDING_ADDRESS)
  const needsSchool = classFormats.includes(O.FORMAT_NEEDING_SCHOOL)

  const selectLearnerType = (value: 'self' | 'child') => {
    setLearnerType(value)
    // Odznacz „W szkole dziecka”, gdyby był już zaznaczony przed zmianą na
    // „dla mnie” — inaczej formularz wysłałby wybór, którego już nie pokazuje.
    if (value === 'self') {
      setClassFormats((current) => current.filter((format) => format !== O.FORMAT_NEEDING_SCHOOL))
    }
  }

  const toggleMode = (value: string) => {
    setModes((current) => {
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
      // Odznaczenie trybu chowa formy zajęć, które istniały tylko dzięki niemu
      // (np. „Z dojazdem" znika po odznaczeniu „Indywidualnie") — inaczej
      // zostałby zaznaczony wybór, którego formularz już nie pokazuje.
      const allowed = new Set(O.optionValues(O.formatOptionsFor(next)))
      setClassFormats((currentFormats) => currentFormats.filter((format) => allowed.has(format)))
      return next
    })
  }

  const toggleFormat = (value: string) => {
    setClassFormats((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    )
  }

  const addSlot = (day: DayKey) =>
    setSlots((current) => {
      const existing = current[day]
      if (existing.length >= MAX_SLOTS_PER_DAY) return current
      slotId.current += 1
      const slot: EditableSlot = { id: `${day}-${slotId.current}`, ...suggestSlot(existing) }
      return { ...current, [day]: [...existing, slot] }
    })

  const updateSlot = (day: DayKey, id: string, next: TimeSlot) =>
    setSlots((current) => ({
      ...current,
      [day]: current[day].map((slot) => (slot.id === id ? { ...slot, ...next } : slot)),
    }))

  const removeSlot = (day: DayKey, id: string) =>
    setSlots((current) => ({
      ...current,
      [day]: current[day].filter((slot) => slot.id !== id),
    }))

  const failWith = (nextErrors: Errors) => {
    setErrors(nextErrors)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (learnerType !== 'self' && learnerType !== 'child') {
      failWith({ learnerType: 'Wybierz, dla kogo są zajęcia.' })
      return
    }

    const form = new FormData(event.currentTarget)
    const parentFirstName = form.get('parentFirstName')
    const parentLastName = form.get('parentLastName')

    const payload = {
      parentFirstName,
      parentLastName,
      email: form.get('email'),
      phone: form.get('phone'),
      learnerType,
      // Dla zgłoszenia „dla mnie" nie pytamy o osobne imię — to ta sama osoba,
      // co w danych kontaktowych wyżej.
      childName: learnerType === 'self'
        ? `${parentFirstName ?? ''} ${parentLastName ?? ''}`.trim()
        : form.get('childName'),
      // Wiek pytamy tylko przy „dla dziecka" — patrz pole niżej w formularzu.
      childAge: learnerType === 'self' ? null : Number(form.get('childAge')),
      level: form.get('level'),
      mode: modes,
      classFormat: classFormats,
      address: form.get('address') ?? '',
      schoolName: form.get('schoolName') ?? '',
      schoolCity: form.get('schoolCity') ?? '',
      availability: DAYS.map((day) => ({
        day: day.key,
        slots: slots[day.key].map(({ start, end }) => ({ start, end })),
      })).filter((day) => day.slots.length > 0),
      notes: form.get('notes') ?? '',
      preferredTeacher: form.get('preferredTeacher') ?? '',
      referralCode,
      consent: form.get('consent') === 'on',
      startedAt: startedAt.current,
    }

    // Ta sama walidacja co na serwerze — rodzic dostaje komplet błędów od razu,
    // bez czekania na odpowiedź, a endpoint i tak sprawdza wszystko od nowa.
    const validation = validateAvailabilitySubmission(payload)
    if (!validation.ok) {
      failWith(validation.errors)
      return
    }

    setSending(true)
    setErrors({})
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        failWith(result.errors || { form: result.error || 'Nie udało się wysłać formularza. Spróbuj ponownie.' })
        return
      }
      trackConversion('dostepnosc_wyslana', {
        metaEvent: 'Lead',
        tryb: modes.join(','),
        forma: classFormats.join(','),
      })
      setDone(true)
    } catch {
      failWith({ form: 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.' })
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className={`${styles.shell} ${styles.success}`} role="status">
        <UNickorn variant="trophy" size={84} />
        <h2>Dziękujemy!</h2>
        <p>
          Mamy Wasze terminy. Układamy grafik na nowy rok szkolny i wrócimy do Was z propozycją
          zajęć — telefonicznie albo mailem, na podane dane kontaktowe.
        </p>
      </div>
    )
  }

  const errorList = Object.values(errors)

  const levelField = (
    <label>
      Poziom angielskiego
      <select name="level" defaultValue="">
        <option value="">Wybierz (opcjonalnie)</option>
        {O.levelOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError name="level" errors={errors} />
    </label>
  )

  return (
    <form className={styles.shell} onSubmit={submit} noValidate>
      <p className={styles.hint}>Pola oznaczone gwiazdką (*) są wymagane.</p>

      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className={styles.summary}>
          <h3>Sprawdź jeszcze te pola</h3>
          <ul>
            {errorList.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <fieldset>
        <legend>Kontakt</legend>
        <div className={styles.cols}>
          <label>
            Imię *
            <input name="parentFirstName" maxLength={80} autoComplete="given-name" />
            <FieldError name="parentFirstName" errors={errors} />
          </label>
          <label>
            Nazwisko *
            <input name="parentLastName" maxLength={80} autoComplete="family-name" />
            <FieldError name="parentLastName" errors={errors} />
          </label>
        </div>
        <div className={styles.cols}>
          <label>
            E-mail *
            <input name="email" type="email" maxLength={160} autoComplete="email" placeholder="anna@example.com" />
            <FieldError name="email" errors={errors} />
          </label>
          <label>
            Telefon *
            <input name="phone" type="tel" maxLength={40} autoComplete="tel" placeholder="600 100 200" />
            <FieldError name="phone" errors={errors} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Dla kogo są zajęcia? *</legend>
        <div className={styles.group}>
          <div className={styles.choices}>
            <label className={styles.choice}>
              <input
                type="radio"
                name="learnerType"
                checked={learnerType === 'self'}
                onChange={() => selectLearnerType('self')}
              />
              <span>Dla mnie</span>
            </label>
            <label className={styles.choice}>
              <input
                type="radio"
                name="learnerType"
                checked={learnerType === 'child'}
                onChange={() => selectLearnerType('child')}
              />
              <span>Dla dziecka</span>
            </label>
          </div>
          <FieldError name="learnerType" errors={errors} />
        </div>
      </fieldset>

      {learnerType === 'child' && (
        <fieldset>
          <legend>Dziecko</legend>
          <div className={styles.cols}>
            <label>
              Imię dziecka *
              <input name="childName" maxLength={80} />
              <FieldError name="childName" errors={errors} />
            </label>
            <label>
              Wiek dziecka *
              <input
                name="childAge"
                type="number"
                inputMode="numeric"
                min={O.MIN_AGE}
                max={O.MAX_AGE}
              />
              <FieldError name="childAge" errors={errors} />
            </label>
          </div>
          {levelField}
        </fieldset>
      )}

      {learnerType === 'self' && (
        <fieldset>
          <legend>O Tobie</legend>
          {levelField}
        </fieldset>
      )}

      <fieldset>
        <legend>Rodzaj zajęć</legend>
        <div className={styles.group}>
          <p className={styles.groupLabel}>Grupowo czy indywidualnie? * (można zaznaczyć oba)</p>
          <div className={styles.choices}>
            {O.modeOptions.map((option) => (
              <label key={option.value} className={styles.choice}>
                <input
                  type="checkbox"
                  checked={modes.includes(option.value)}
                  onChange={() => toggleMode(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <FieldError name="mode" errors={errors} />
        </div>

        {/* Pola warunkowe pojawiają się dopiero, gdy zaczynają mieć znaczenie —
            dzięki temu formularz na pierwszy rzut oka jest krótki. */}
        {modes.length > 0 && (
          <div className={styles.group}>
            <p className={styles.groupLabel}>Forma zajęć * (można zaznaczyć kilka)</p>
            <div className={styles.choices}>
              {formatOptions.map((option) => (
                <label key={option.value} className={styles.choice}>
                  <input
                    type="checkbox"
                    checked={classFormats.includes(option.value)}
                    onChange={() => toggleFormat(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <FieldError name="classFormat" errors={errors} />
          </div>
        )}

        {needsAddress && (
          <label>
            Adres *
            <input name="address" maxLength={200} autoComplete="street-address" />
            <small>Pod ten adres dojedzie nauczyciel.</small>
            <FieldError name="address" errors={errors} />
          </label>
        )}

        {needsSchool && (
          <div className={styles.cols}>
            <label>
              Nazwa szkoły *
              <input name="schoolName" maxLength={160} />
              <FieldError name="schoolName" errors={errors} />
            </label>
            <label>
              Miejscowość *
              <input name="schoolCity" maxLength={120} />
              <FieldError name="schoolCity" errors={errors} />
            </label>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend>Preferowane dni i godziny *</legend>
        <p className={styles.sectionIntro}>
          Zaznacz, kiedy {learnerType === 'self' ? 'masz wolne' : 'dziecko jest wolne'}. Przeciągnij
          oba końce suwaka, żeby ustawić godziny co 15 minut. Jeśli danego dnia macie dwa osobne
          okna — rano i wieczorem — dodaj drugi przedział.
        </p>
        <FieldError name="availability" errors={errors} />

        <div className={styles.days}>
          {DAYS.map((day) => {
            const daySlots = slots[day.key]
            return (
              <section key={day.key} className={styles.day}>
                <header className={styles.dayHeader}>
                  <h3>{day.label}</h3>
                  {daySlots.length > 0 && (
                    <span className={styles.daySummary}>
                      {/* Podsumowanie po godzinach, jak w arkuszu. Same suwaki
                          zostają w kolejności dodania — przeskakiwałyby w trakcie
                          przeciągania, gdyby sortować i je. */}
                      {[...daySlots]
                        .sort((a, b) => a.start - b.start)
                        .map((slot) => formatSlot(slot))
                        .join(' oraz ')}
                    </span>
                  )}
                </header>

                {daySlots.length === 0 ? (
                  <button type="button" className={styles.addFirst} onClick={() => addSlot(day.key)}>
                    + Dodaj dostępność
                  </button>
                ) : (
                  <>
                    {daySlots.map((slot, index) => (
                      <div key={slot.id} className={styles.slot}>
                        <TimeRangeSlider
                          value={{ start: slot.start, end: slot.end }}
                          onChange={(next) => updateSlot(day.key, slot.id, next)}
                          context={`${day.label}, przedział ${index + 1}`}
                        />
                        <button
                          type="button"
                          className={styles.remove}
                          onClick={() => removeSlot(day.key, slot.id)}
                        >
                          Usuń
                          <span className="visually-hidden">
                            {` przedział ${index + 1} w dniu ${day.label.toLowerCase()}`}
                          </span>
                        </button>
                      </div>
                    ))}
                    {daySlots.length < MAX_SLOTS_PER_DAY && (
                      <button
                        type="button"
                        className={styles.addMore}
                        onClick={() => addSlot(day.key)}
                      >
                        + Dodaj kolejny przedział
                        <span className="visually-hidden">{` w dniu ${day.label.toLowerCase()}`}</span>
                      </button>
                    )}
                  </>
                )}
              </section>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Na koniec</legend>
        <label>
          Preferowany nauczyciel (niewymagane)
          <input
            name="preferredTeacher"
            maxLength={120}
            placeholder="np. pani Kasia — jeśli już Was ktoś uczył albo był polecony"
          />
          <small>Postaramy się dopasować, ale bez gwarancji — zależy od wolnych terminów.</small>
        </label>

        <label>
          Dodatkowe uwagi
          <textarea
            name="notes"
            maxLength={2000}
            rows={4}
            placeholder="Rodzeństwo w jednej grupie, dojazd z innej miejscowości, cokolwiek co pomoże nam ułożyć grafik…"
          />
          <FieldError name="notes" errors={errors} />
        </label>

        <label>
          Kod polecenia (jeśli ktoś Was do nas skierował)
          <input
            name="referralCode"
            maxLength={40}
            value={referralCode}
            onChange={(event) => setReferralCode(event.target.value)}
            placeholder="np. uNickAnna8DJ9"
          />
          <small>Wpiszcie, jeśli ktoś polecił Wam uNick Academy — uwzględnimy to przy zapisie.</small>
        </label>

        <label className={styles.consent}>
          <input type="checkbox" name="consent" />
          <span>
            Wyrażam zgodę na przetwarzanie {learnerType === 'child' ? 'moich danych osobowych oraz danych dziecka' : 'moich danych osobowych'} w celu
            ustalenia grafiku zajęć i kontaktu w tej sprawie, zgodnie z{' '}
            <Link href={`/${locale}/privacy-policy`} target="_blank" className={styles.link}>
              Polityką Prywatności
            </Link>
            . *
          </span>
        </label>
        <FieldError name="consent" errors={errors} />
      </fieldset>

      <Button type="submit" variant="primary" fullWidth disabled={sending}>
        {sending ? 'Wysyłamy…' : 'Wyślij dostępność'}
      </Button>
    </form>
  )
}

function FieldError({ name, errors }: { name: string; errors: Errors }) {
  return errors[name] ? <p className={styles.error}>{errors[name]}</p> : null
}
