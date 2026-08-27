'use client'

import Link from 'next/link'
import { useRef, useState, type FormEvent } from 'react'
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

  const [mode, setMode] = useState('')
  const [classFormat, setClassFormat] = useState('')
  const [slots, setSlots] = useState<SlotsByDay>(emptySlots)
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const formatOptions = mode ? O.formatOptionsFor(mode) : []
  const needsAddress = classFormat === O.FORMAT_NEEDING_ADDRESS
  const needsSchool = classFormat === O.FORMAT_NEEDING_SCHOOL

  const changeMode = (nextMode: string) => {
    setMode(nextMode)
    // „Online” i „W Rumianku” są w obu listach — nie każemy wybierać dwa razy.
    setClassFormat((current) =>
      current && O.isOption(O.formatOptionsFor(nextMode), current) ? current : ''
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
    const form = new FormData(event.currentTarget)

    const payload = {
      parentFirstName: form.get('parentFirstName'),
      parentLastName: form.get('parentLastName'),
      email: form.get('email'),
      phone: form.get('phone'),
      childName: form.get('childName'),
      childAge: Number(form.get('childAge')),
      level: form.get('level'),
      mode,
      classFormat,
      address: form.get('address') ?? '',
      schoolName: form.get('schoolName') ?? '',
      schoolCity: form.get('schoolCity') ?? '',
      availability: DAYS.map((day) => ({
        day: day.key,
        slots: slots[day.key].map(({ start, end }) => ({ start, end })),
      })).filter((day) => day.slots.length > 0),
      notes: form.get('notes') ?? '',
      consent: form.get('consent') === 'on',
      website: form.get('website'),
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
      trackConversion('dostepnosc_wyslana', { metaEvent: 'Lead', tryb: mode, forma: classFormat })
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

      {/* Pułapka na boty — poza ekranem, niedostępna dla klawiatury. */}
      <div className={styles.honeypot} aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>

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
      </fieldset>

      <fieldset>
        <legend>Rodzaj zajęć</legend>
        <label>
          Grupowo czy indywidualnie? *
          <select value={mode} onChange={(event) => changeMode(event.target.value)}>
            <option value="">Wybierz</option>
            {O.modeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError name="mode" errors={errors} />
        </label>

        {/* Pola warunkowe pojawiają się dopiero, gdy zaczynają mieć znaczenie —
            dzięki temu formularz na pierwszy rzut oka jest krótki. */}
        {mode && (
          <label>
            Forma zajęć *
            <select value={classFormat} onChange={(event) => setClassFormat(event.target.value)}>
              <option value="">Wybierz</option>
              {formatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError name="classFormat" errors={errors} />
          </label>
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
          Zaznacz, kiedy dziecko jest wolne. Przeciągnij oba końce suwaka, żeby ustawić godziny
          co 15 minut. Jeśli danego dnia macie dwa osobne okna — rano i wieczorem — dodaj drugi
          przedział.
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
          Dodatkowe uwagi
          <textarea
            name="notes"
            maxLength={2000}
            rows={4}
            placeholder="Rodzeństwo w jednej grupie, dojazd z innej miejscowości, cokolwiek co pomoże nam ułożyć grafik…"
          />
          <FieldError name="notes" errors={errors} />
        </label>

        <label className={styles.consent}>
          <input type="checkbox" name="consent" />
          <span>
            Wyrażam zgodę na przetwarzanie moich danych osobowych oraz danych dziecka w celu
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
