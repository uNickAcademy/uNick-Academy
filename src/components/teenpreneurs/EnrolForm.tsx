'use client'

import { useState } from 'react'
import type { TpDictionary } from '@/lib/teenpreneurs/i18n'
import { TP_ENROLMENT } from '@/lib/teenpreneurs/products'
import { TpButton } from './TpButton'

const inputCls =
  'w-full rounded-xl border border-tp-navy/20 bg-white px-4 py-3 font-tp-display text-tp-navy placeholder:text-tp-ink/40'

/** Captures age track + time slot before payment; both ride Stripe metadata
 *  into the webhook and land on the enrolment record. */
export function EnrolForm({ dict, locale }: { dict: TpDictionary; locale: string }) {
  const f = dict.enrol.form
  const [studentName, setStudentName] = useState('')
  const [parentName, setParentName] = useState('')
  const [email, setEmail] = useState('')
  const [ageTrack, setAgeTrack] = useState<string>(TP_ENROLMENT.ageTracks[0])
  const [timeSlot, setTimeSlot] = useState<string>(TP_ENROLMENT.timeSlots[0])
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<'idle' | 'busy' | 'error' | 'offline'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('busy')
    try {
      const res = await fetch('/api/teenpreneurs/enrol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName, parentName, email, ageTrack, timeSlot, locale }),
      })
      const data = await res.json()
      if (res.status === 503) return setState('offline')
      if (!res.ok || !data.url) throw new Error()
      window.location.assign(data.url)
    } catch {
      setState('error')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="font-tp-display text-xl font-bold text-tp-navy">{f.title}</h2>

      <label className="block">
        <span className="mb-1.5 block font-tp-display text-sm font-medium text-tp-ink">{f.studentNameLabel}</span>
        <input required value={studentName} onChange={e => setStudentName(e.target.value)} className={inputCls} />
      </label>

      <label className="block">
        <span className="mb-1.5 block font-tp-display text-sm font-medium text-tp-ink">{f.parentName}</span>
        <input required value={parentName} onChange={e => setParentName(e.target.value)} className={inputCls} />
      </label>

      <label className="block">
        <span className="mb-1.5 block font-tp-display text-sm font-medium text-tp-ink">{f.email}</span>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
      </label>

      <fieldset>
        <legend className="mb-1.5 font-tp-display text-sm font-medium text-tp-ink">{f.ageTrack}</legend>
        <div className="grid grid-cols-2 gap-3">
          {TP_ENROLMENT.ageTracks.map(track => (
            <label
              key={track}
              className={`cursor-pointer rounded-xl border-2 px-4 py-3 text-center font-tp-display font-semibold transition-colors ${
                ageTrack === track ? 'border-tp-coral bg-tp-coral/5 text-tp-navy' : 'border-tp-navy/15 text-tp-ink/70 hover:border-tp-navy/40'
              }`}
            >
              <input
                type="radio" name="ageTrack" value={track} checked={ageTrack === track}
                onChange={() => setAgeTrack(track)} className="tp-visually-hidden"
              />
              {track}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-tp-ink/60">{f.ageTrackNote}</p>
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block font-tp-display text-sm font-medium text-tp-ink">{f.timeSlot}</span>
        <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className={inputCls}>
          {TP_ENROLMENT.timeSlots.map(slot => (
            <option key={slot} value={slot}>{f.slots[slot]}</option>
          ))}
        </select>
        <span className="mt-1.5 block text-xs text-tp-ink/60">{f.slotNote}</span>
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 accent-tp-coral"
        />
        <span className="text-sm leading-relaxed text-tp-ink/80">{f.consent}</span>
      </label>

      {state === 'error' && <p role="alert" className="font-medium text-tp-coral">{f.error}</p>}
      {state === 'offline' && <p role="alert" className="font-medium text-tp-coral">{f.notConfigured}</p>}

      <TpButton type="submit" disabled={state === 'busy'} className="w-full">
        {state === 'busy' ? f.submitting : f.submit}
      </TpButton>
    </form>
  )
}
