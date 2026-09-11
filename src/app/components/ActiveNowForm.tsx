'use client'

import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '@/app/lib/site-config'

// Zapisy, lekcje i płatności prowadzimy w ActiveNow, a formularze zapisu
// osadzamy u siebie. Adresy są skopiowane 1:1 z kodu osadzenia wygenerowanego
// w panelu ActiveNow — nie sklejamy ich z kawałków, żeby przebudowa formularza
// po ich stronie sprowadzała się do podmiany jednej stałej tutaj.
export const ACTIVENOW_FORMS = {
  grupowe: {
    id: '106695',
    src: 'https://app.activenow.io/external/signup_form/load_by_js?age_group=&city_id=&code=Hls3ld4szspuargB&discipline_id=&proficiency_id=&school_id=10706&signup_form_id=106695&venue_id=&zz=',
  },
  indywidualne: {
    id: '98784',
    src: 'https://app.activenow.io/external/signup_form/load_by_js?code=Hls3ld4szspuargB&school_id=10706&signup_form_id=98784&zz=',
  },
} as const

export type ActiveNowFormKey = keyof typeof ACTIVENOW_FORMS

// Spinner ActiveNow na czas wczytywania — ich skrypt podmienia całą zawartość
// kontenera na gotowy formularz.
//
// Wstawiamy go przez dangerouslySetInnerHTML celowo: tak React przestaje
// pilnować wnętrza tego diva. Gdyby trzymał tam własne drzewo, pierwsze
// przerysowanie komponentu próbowałoby pogodzić je z DOM-em podmienionym przez
// ActiveNow i wywracało stronę błędem removeChild.
const PLACEHOLDER =
  '<div style="text-align:center;padding:40px 0">' +
  '<img src="https://www.activenow.io/assets/ripple.gif" width="100" height="100" alt="Wczytujemy formularz zapisu" />' +
  '</div>'

export function ActiveNowForm({ form }: { form: ActiveNowFormKey }) {
  const { id, src } = ACTIVENOW_FORMS[form]
  const hostRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    // W trybie deweloperskim React montuje komponent dwukrotnie. Bez tej bramki
    // skrypt wszedłby do kontenera dwa razy i formularz wyrenderowałby się podwójnie.
    if (!host || host.querySelector('script[data-activenow]')) return

    const script = document.createElement('script')
    script.async = true
    script.src = src
    script.dataset.activenow = id
    // Blokery reklam i filtry sieciowe potrafią wyciąć ten skrypt. Bez tego
    // rodzic zostaje z kręcącym się w nieskończoność spinnerem i bez wiedzy,
    // że coś poszło nie tak.
    script.addEventListener('error', () => setFailed(true))
    host.appendChild(script)
  }, [id, src])

  return (
    <div>
      {failed && (
        <p role="alert" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Formularz zapisu nie chce się wczytać. Zwykle blokuje go rozszerzenie
          do blokowania reklam albo filtr sieci. Napisz do nas na{' '}
          <a href={`mailto:${siteConfig.email}`} className="font-semibold underline">{siteConfig.email}</a>
          {' '}albo zadzwoń:{' '}
          <a href={`tel:${siteConfig.phone.e164}`} className="font-semibold underline">{siteConfig.phone.display}</a>, zapiszemy Cię ręcznie.
        </p>
      )}
      <div
        ref={hostRef}
        className={`activenow-form-container activenow-form-${id}-container`}
        dangerouslySetInnerHTML={{ __html: PLACEHOLDER }}
      />
      <noscript>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Formularz zapisu potrzebuje włączonego JavaScriptu. Możesz też napisać
          na {siteConfig.email} albo zadzwonić: {siteConfig.phone.display}.
        </p>
      </noscript>
    </div>
  )
}
