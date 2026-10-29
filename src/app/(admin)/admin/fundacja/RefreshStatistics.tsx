'use client'

import {useCallback, useEffect, useRef, useTransition} from 'react'
import {useRouter} from 'next/navigation'

const REFRESH_INTERVAL_MS = 60_000
const FOCUS_THROTTLE_MS = 5_000

export default function RefreshStatistics() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const lastRefresh = useRef(0)
  const refresh = useCallback(() => {
    lastRefresh.current = Date.now()
    startTransition(() => router.refresh())
  }, [router])

  useEffect(() => {
    lastRefresh.current = Date.now()
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRefresh.current >= FOCUS_THROTTLE_MS) refresh()
    }
    const interval = window.setInterval(refreshWhenVisible, REFRESH_INTERVAL_MS)
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [refresh])

  return <button type="button" disabled={isPending} onClick={refresh}
    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-900 disabled:opacity-60"
    aria-live="polite">
    {isPending ? 'Odświeżam…' : 'Odśwież dane'}
  </button>
}
