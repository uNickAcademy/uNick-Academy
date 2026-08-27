'use client'

import { useCallback, useEffect, useState } from 'react'
import Button from '../Button'
import UNickorn from '../UNickorn'
import { isFormOpen } from '@/lib/availability/window'
import styles from './AvailabilityPopup.module.css'

// TYMCZASOWY popup na stronie głównej (nabór wrzesień 2026) — zapowiada
// formularz dostępności zaraz po wejściu na stronę. Pokazuje się raz na
// sesję przeglądarki (sessionStorage), żeby nie męczyć kogoś, kto wraca na
// stronę główną kilka razy pod rząd.
//
// Usuwanie razem z resztą naboru: docs/FORMULARZ-DOSTEPNOSCI.md.
const DISMISSED_KEY = 'dostepnosc-popup-zamkniety'

function alreadyDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    // Tryb prywatny bywa blokuje dostęp do sessionStorage — wtedy po prostu
    // pokazujemy popup za każdym razem zamiast wywracać stronę błędem.
    return false
  }
}

function remember() {
  try {
    sessionStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    // jw. — zapominanie o zamknięciu nie jest warte awarii.
  }
}

export default function AvailabilityPopup({ locale }: { locale: string }) {
  const [visible, setVisible] = useState(false)

  const close = useCallback(() => {
    setVisible(false)
    remember()
  }, [])

  useEffect(() => {
    // Sesja i data zamknięcia istnieją tylko w przeglądarce — SSR nie zna
    // żadnej z nich, stąd sprawdzenie w efekcie zamiast przy pierwszym renderze.
    if (locale === 'pl' && isFormOpen() && !alreadyDismissed()) setVisible(true)
  }, [locale])

  useEffect(() => {
    if (!visible) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [visible, close])

  if (!visible) return null

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
      role="presentation"
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="availability-popup-title">
        <button className={styles.close} onClick={close} aria-label="Zamknij">
          ✕
        </button>
        <UNickorn variant="wave" size={72} className={styles.mascot} />
        <span className="eyebrow">Rok szkolny 2026/2027</span>
        <h2 id="availability-popup-title" className={styles.title}>
          Zapisy na wrzesień
        </h2>
        <p className={styles.text}>
          Układamy grafik zajęć tak, żeby dopasować się do Ciebie. Powiedz nam, kiedy Twoje
          dziecko ma wolne, a my zajmiemy się resztą.
        </p>
        {/* Tylko zapamiętanie, bez setVisible: ten klik już nawiguje na inną
            stronę, więc popup i tak zniknie wraz z odmontowaniem strony
            głównej — chowanie go tu, w trakcie kliknięcia w <Link>, potrafi
            przerwać nawigację, jeśli DOM zniknie zanim router dokończy. */}
        <Button href="/pl/dostepnosc" fullWidth onClick={remember}>
          Wypełnij formularz
        </Button>
        <button className={styles.later} onClick={close} type="button">
          Może później
        </button>
      </div>
    </div>
  )
}
