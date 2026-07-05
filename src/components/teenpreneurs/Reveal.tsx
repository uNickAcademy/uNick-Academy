'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

/** Fade-up on scroll. No-ops for reduced motion / no JS (content stays visible). */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'pending' | 'shown' | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setState('pending')
    const io = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setState('shown')
          io.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`tp-reveal ${className ?? ''}`}
      data-reveal={state ?? undefined}
      style={state === 'shown' && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
