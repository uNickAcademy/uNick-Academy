'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'

export function PayOnlineButton({ amount, studentId, description, label, unavailableLabel, stripeReady, className }: {
  amount: number
  studentId: string
  description: string
  label: string
  unavailableLabel: string
  stripeReady: boolean
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pay = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, studentId, description }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? unavailableLabel)
      }
    } catch {
      setError(unavailableLabel)
    } finally {
      setLoading(false)
    }
  }

  if (!stripeReady) {
    return <p className="text-xs text-gray-400">{unavailableLabel}</p>
  }

  return (
    <div>
      <button
        onClick={pay}
        disabled={loading || amount <= 0}
        className={className ?? 'flex items-center gap-2 px-5 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-md disabled:opacity-50'}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
        {label}
      </button>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
