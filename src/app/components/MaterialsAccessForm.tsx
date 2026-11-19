'use client'

import { useState, type FormEvent } from 'react'
import { materialsCopy } from '@/lib/lesson-materials/copy'
import styles from './lesson-materials.module.css'

type AccessFormProps = {
  language: 'pl' | 'en'
  topic?: string
}

export default function MaterialsAccessForm({ language, topic }: AccessFormProps) {
  const t = materialsCopy[language]
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const [retryAfter, setRetryAfter] = useState(0)

  async function requestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return
    if (Date.now() < retryAfter) {
      setError(t.wait)
      return
    }
    const form = new FormData(event.currentTarget)
    setStatus('sending')
    setError('')
    try {
      const response = await fetch('/api/lesson-materials/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'), locale: language, topic,
          newsletter: form.get('newsletter') === 'on',
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.code === 'invalid' ? t.invalid : result.code === 'wait' ? t.wait : t.unavailable)
        setStatus('idle')
        return
      }
      setStatus('sent')
      setRetryAfter(Date.now() + 60_000)
    } catch {
      setError(t.unavailable)
      setStatus('idle')
    }
  }

  return (
    <section id="access" aria-labelledby="materials-access-heading" className={styles.access}>
      <div>
        <h2 id="materials-access-heading">{t.accessTitle}</h2>
        <p>{t.accessIntro}</p>
      </div>
      <form onSubmit={requestAccess} className={styles.accessForm} aria-busy={status === 'sending'}>
        <label htmlFor="materials-email">{t.email}</label>
        <div className={styles.emailRow}>
          <input
            id="materials-email" name="email" type="email" autoComplete="email" inputMode="email"
            required maxLength={254} aria-describedby={error ? 'materials-error' : 'materials-privacy'}
            aria-invalid={error === t.invalid || undefined}
          />
          <button className={styles.accessButton} type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? t.sending : status === 'sent' ? t.retry : t.submit}
          </button>
        </div>
        <label className={styles.newsletter}>
          <input name="newsletter" type="checkbox" />
          <span>{t.newsletter} <span className={styles.optional}>({t.optional})</span></span>
        </label>
        <p id="materials-privacy" className={styles.privacy}>
          {t.privacy}{' '}
          <a href={`/${language}/privacy-policy#lesson-materials`}>{t.privacyLink}</a>
        </p>
        {error && <p id="materials-error" role="alert" className={styles.formError}>{error}</p>}
        <div role="status" aria-live="polite">
          {status === 'sent' && (
            <div className={styles.success}><strong>{t.sentTitle}</strong><p>{t.sent}</p></div>
          )}
        </div>
      </form>
    </section>
  )
}
