'use client'

import { useEffect } from 'react'
import { captureTouch } from '@/lib/analytics/attribution'
import { CONSENT_CHANGED_EVENT } from '../lib/cookie-consent'

// Zapisuje źródło wejścia (utm_*, gclid/fbclid, ?ref=, strona odsyłająca) przy
// każdej odsłonie strony publicznej. Nic nie renderuje.
//
// Musi siedzieć w layoucie, a nie przy formularzu: znaczniki kampanii niesie
// tylko pierwszy adres, na który ktoś wchodzi z reklamy, a formularz bywa dwa
// kliknięcia dalej.
//
// Powtórka po zmianie zgody nie jest kosmetyką: do czasu zgody dotknięcie
// leży wyłącznie w pamięci sesji, a dopiero zgoda pozwala przenieść je do
// pamięci długoterminowej — czyli utrzymać atrybucję, gdy ktoś wróci jutro.
export function AttributionCapture() {
  useEffect(() => {
    captureTouch()
    const onConsent = () => captureTouch()
    window.addEventListener(CONSENT_CHANGED_EVENT, onConsent)
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onConsent)
  }, [])

  return null
}
