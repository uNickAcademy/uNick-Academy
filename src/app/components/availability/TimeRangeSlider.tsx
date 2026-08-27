'use client'

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import {
  MAX_MINUTES,
  MIN_MINUTES,
  MIN_SLOT_MINUTES,
  STEP_MINUTES,
  formatTime,
  snapToStep,
  type TimeSlot,
} from '@/lib/availability/schedule'
import styles from './TimeRangeSlider.module.css'

// Suwak zakresu z dwoma uchwytami. Natywny <input type="range"> ma tylko jeden,
// a układanie dwóch jeden na drugim psuje się, gdy uchwyty stoją blisko siebie
// (nie da się złapać tego pod spodem). Dlatego wzorzec WAI-ARIA „dual-thumb
// slider”: wspólny tor obsługiwany zdarzeniami Pointer Events (mysz, dotyk i
// rysik jednym kodem) plus dwa elementy role="slider" obsługiwane klawiaturą.

const SPAN = MAX_MINUTES - MIN_MINUTES
/** Ile pikseli w poziomie odróżnia przeciąganie suwaka od przewijania strony. */
const TOUCH_SLOP = 8
const percent = (minutes: number) => ((minutes - MIN_MINUTES) / SPAN) * 100

type Handle = 'start' | 'end'

type Props = {
  value: TimeSlot
  onChange: (next: TimeSlot) => void
  /** Kontekst dla czytnika ekranu, np. „Poniedziałek, przedział 1”. */
  context: string
}

export default function TimeRangeSlider({ value, onChange, context }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<Handle | null>(null)
  const dragOrigin = useRef({ x: 0, y: 0 })
  // `armed` — czy wolno już przesuwać wartość; `pointerMoved` — czy gest był
  // czymkolwiek więcej niż tapnięciem.
  const armed = useRef(false)
  const pointerMoved = useRef(false)
  const [active, setActive] = useState<Handle | null>(null)

  // Uchwyty nigdy się nie mijają: „od” zatrzymuje się kwadrans przed „do”.
  const commit = (handle: Handle, raw: number) => {
    if (handle === 'start') {
      const start = Math.min(snapToStep(raw), value.end - MIN_SLOT_MINUTES)
      if (start !== value.start) onChange({ start, end: value.end })
    } else {
      const end = Math.max(snapToStep(raw), value.start + MIN_SLOT_MINUTES)
      if (end !== value.end) onChange({ start: value.start, end })
    }
  }

  const valueAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || !rect.width) return value.start
    return snapToStep(MIN_MINUTES + ((clientX - rect.left) / rect.width) * SPAN)
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = valueAt(event.clientX)
    // Prowadzimy ten uchwyt, który jest bliżej miejsca dotknięcia — także gdy
    // oba stoją obok siebie, bo decyduje odległość, a nie kolejność w DOM.
    const handle: Handle =
      Math.abs(target - value.start) <= Math.abs(target - value.end) ? 'start' : 'end'
    dragging.current = handle
    dragOrigin.current = { x: event.clientX, y: event.clientY }
    pointerMoved.current = false
    setActive(handle)
    event.currentTarget.setPointerCapture(event.pointerId)
    // Dotyk: nie ruszamy uchwytu już przy dotknięciu — palec mógł wylądować na
    // suwaku tylko po to, żeby przewinąć stronę. Myszy to nie dotyczy, bo tam
    // kliknięcie nigdy nie oznacza przewijania.
    armed.current = event.pointerType !== 'touch'
    if (armed.current) commit(handle, target)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return

    const dx = event.clientX - dragOrigin.current.x
    const dy = event.clientY - dragOrigin.current.y
    if (Math.abs(dx) > TOUCH_SLOP || Math.abs(dy) > TOUCH_SLOP) pointerMoved.current = true

    // Suwak budzi dopiero ruch w poziomie. Gest w pionie zostawiamy stronie —
    // rodzic przewijający listę dni palcem po suwaku nie przestawi godzin.
    if (!armed.current) {
      if (Math.abs(dx) <= TOUCH_SLOP) return
      armed.current = true
    }
    commit(dragging.current, valueAt(event.clientX))
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const handle = dragging.current
    if (!handle) return
    // Samo tapnięcie w tor (bez przeciągania) przestawia najbliższy uchwyt.
    if (!pointerMoved.current) commit(handle, valueAt(event.clientX))
    dragging.current = null
    setActive(null)
  }

  const stopDrag = () => {
    dragging.current = null
    setActive(null)
  }

  const handleKeyDown = (handle: Handle) => (event: KeyboardEvent<HTMLDivElement>) => {
    const current = handle === 'start' ? value.start : value.end
    const bounds = handleBounds(handle, value)
    let next: number | null = null

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = current + STEP_MINUTES
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        next = current - STEP_MINUTES
        break
      case 'PageUp':
        next = current + 60
        break
      case 'PageDown':
        next = current - 60
        break
      case 'Home':
        next = bounds.min
        break
      case 'End':
        next = bounds.max
        break
      default:
        return
    }

    event.preventDefault()
    commit(handle, next)
  }

  const startPercent = percent(value.start)
  const endPercent = percent(value.end)

  return (
    <div className={styles.wrap}>
      <p className={styles.readout}>
        <span className={styles.readoutTime}>{formatTime(value.start)}</span>
        <span className={styles.readoutSeparator}>do</span>
        <span className={styles.readoutTime}>{formatTime(value.end)}</span>
      </p>

      <div
        ref={trackRef}
        className={styles.track}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={stopDrag}
        onLostPointerCapture={stopDrag}
      >
        <span className={styles.rail} />
        <span
          className={styles.fill}
          style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
        />
        <Thumb
          handle="start"
          value={value}
          position={startPercent}
          active={active === 'start'}
          context={context}
          onKeyDown={handleKeyDown('start')}
        />
        <Thumb
          handle="end"
          value={value}
          position={endPercent}
          active={active === 'end'}
          context={context}
          onKeyDown={handleKeyDown('end')}
        />
      </div>

      <div className={styles.scale} aria-hidden="true">
        <span>{formatTime(MIN_MINUTES)}</span>
        <span>{formatTime(MAX_MINUTES)}</span>
      </div>
    </div>
  )
}

/** Zakres, w jakim wolno przesunąć dany uchwyt (także dla ARIA). */
function handleBounds(handle: Handle, value: TimeSlot) {
  return handle === 'start'
    ? { min: MIN_MINUTES, max: value.end - MIN_SLOT_MINUTES }
    : { min: value.start + MIN_SLOT_MINUTES, max: MAX_MINUTES }
}

function Thumb({
  handle,
  value,
  position,
  active,
  context,
  onKeyDown,
}: {
  handle: Handle
  value: TimeSlot
  position: number
  active: boolean
  context: string
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}) {
  const current = handle === 'start' ? value.start : value.end
  const bounds = handleBounds(handle, value)

  return (
    <div
      role="slider"
      tabIndex={0}
      className={`${styles.thumb} ${active ? styles.thumbActive : ''}`.trim()}
      style={{ left: `${position}%` }}
      aria-label={`${context}: godzina ${handle === 'start' ? 'początkowa' : 'końcowa'}`}
      aria-valuemin={bounds.min}
      aria-valuemax={bounds.max}
      aria-valuenow={current}
      aria-valuetext={formatTime(current)}
      onKeyDown={onKeyDown}
    />
  )
}
