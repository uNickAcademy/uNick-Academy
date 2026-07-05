'use client'

import { useState } from 'react'
import type { TpDictionary } from '@/lib/teenpreneurs/i18n'
import { TpButton } from './TpButton'

export function EventForm({ dict, locale }: { dict: TpDictionary; locale: string }) {
  const f = dict.event.form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'duplicate' | 'error' | 'offline'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('busy')
    try {
      const res = await fetch('/api/teenpreneurs/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, consent, locale }),
      })
      if (res.status === 503) return setState('offline')
      if (res.status === 409) return setState('duplicate')
      if (!res.ok) throw new Error()
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done' || state === 'duplicate') {
    return (
      <p role="status" className="rounded-2xl bg-tp-mint/15 p-6 font-tp-display text-lg font-medium text-tp-navy">
        {state === 'done' ? f.success : f.alreadyRegistered}
      </p>
    )
  }

  const inputCls =
    'w-full rounded-xl border border-tp-navy/20 bg-white px-4 py-3 font-tp-display text-tp-navy placeholder:text-tp-ink/40'

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="font-tp-display text-xl font-bold text-tp-navy">{f.title}</h2>
      <label className="block">
        <span className="mb-1.5 block font-tp-display text-sm font-medium text-tp-ink">{f.name}</span>
        <input required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-tp-display text-sm font-medium text-tp-ink">{f.email}</span>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
      </label>
      <label className="flex items-start gap-3">
        <input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-tp-coral" />
        <span className="text-sm leading-relaxed text-tp-ink/80">{f.consent}</span>
      </label>
      {state === 'error' && <p role="alert" className="font-medium text-tp-coral">{dict.common.error}</p>}
      {state === 'offline' && <p role="alert" className="font-medium text-tp-coral">{f.notConfigured}</p>}
      <TpButton type="submit" disabled={state === 'busy'} className="w-full">
        {state === 'busy' ? f.submitting : f.submit}
      </TpButton>
    </form>
  )
}
