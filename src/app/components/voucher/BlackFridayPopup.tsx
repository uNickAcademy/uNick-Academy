'use client'

import { useCallback, useEffect, useRef } from 'react'
import styles from './BlackFridayPopup.module.css'

const DISMISSED_KEY = 'unick-black-friday-2026-live-dismissed'
const PROMOTION_END = Date.parse('2026-12-01T00:00:00+01:00')

export default function BlackFridayPopup({ locale }: { locale: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const rememberDismissal = useCallback(() => {
    try { sessionStorage.setItem(DISMISSED_KEY, '1') } catch { /* Optional preference. */ }
  }, [])
  const close = useCallback(() => {
    dialog.current?.close()
    rememberDismissal()
  }, [rememberDismissal])

  useEffect(() => {
    if (locale !== 'pl' || Date.now() >= PROMOTION_END) return
    let dismissed = false
    try { dismissed = sessionStorage.getItem(DISMISSED_KEY) === '1' } catch { /* Storage may be unavailable. */ }
    const forcePreview = new URLSearchParams(window.location.search).get('voucher-preview') === '1'
    if (!dismissed || forcePreview) dialog.current?.showModal()
    return () => dialog.current?.close()
  }, [locale])

  return (
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="black-friday-title" aria-describedby="black-friday-preview-note"
      onCancel={event => { event.preventDefault(); close() }} onClose={rememberDismissal}
      onClick={event => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
      }}>
      <button className={styles.close} type="button" onClick={close} aria-label="Zamknij ofertę Black Friday">×</button>
      <div className={styles.artwork}>
        {/* Supplied artwork preserves uNickorn's official shield. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/voucher-preview/assets/black-friday-reference.png" width="1254" height="1254" alt="Black Friday uNick Academy: vouchery 250, 500, 1000 i 5000 zł na zajęcia z native speakerami." />
      </div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>BLACK FRIDAY · 27–30 LISTOPADA 2026</p>
        <h2 id="black-friday-title">Podaruj komuś<br /><em>więcej niż słowa.</em></h2>
        <p>Voucher na zajęcia z native speakerami. Dla bliskiej osoby. Albo dla siebie.</p>
        <p id="black-friday-preview-note" className={styles.note}>Voucher z kodem i miejscem na imię — gotowy do podarowania.</p>
        <a className={styles.button} href="/voucher" onClick={rememberDismissal}>Zobacz vouchery</a>
        <button className={styles.later} type="button" onClick={close}>Teraz zostaję na stronie</button>
        <p className={styles.details}>Cztery wartości do wyboru · 12 miesięcy ważności</p>
      </div>
    </dialog>
  )
}
