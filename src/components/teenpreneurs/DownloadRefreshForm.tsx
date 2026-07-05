'use client'

import { useState } from 'react'
import type { TpDictionary } from '@/lib/teenpreneurs/i18n'
import { TpButton } from './TpButton'

export function DownloadRefreshForm({ dict, locale }: { dict: TpDictionary; locale: string }) {
  const r = dict.shop.refresh
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('busy')
    try {
      const res = await fetch('/api/teenpreneurs/download/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      })
      if (!res.ok) throw new Error()
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return <p role="status" className="rounded-2xl bg-tp-mint/15 p-6 font-tp-display font-medium text-tp-navy">{r.success}</p>
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 sm:flex-row">
      <label className="flex-1">
        <span className="tp-visually-hidden">{r.email}</span>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={r.email}
          className="w-full rounded-full border border-tp-navy/20 bg-white px-5 py-3 font-tp-display text-tp-navy placeholder:text-tp-ink/40"
        />
      </label>
      <TpButton type="submit" disabled={state === 'busy'}>
        {state === 'busy' ? r.submitting : r.submit}
      </TpButton>
      {state === 'error' && <p role="alert" className="text-sm font-medium text-tp-coral sm:self-center">{dict.common.error}</p>}
    </form>
  )
}
