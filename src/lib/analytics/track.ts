// Zdarzenia konwersji dla GA4 i Meta Pixel.
//
// Oba skrypty ładują się dopiero po zgodzie na analityczne cookies (komponenty
// GoogleAnalytics i MetaPixel reagują na baner), więc przed zgodą `window.gtag`
// i `window.fbq` po prostu nie istnieją i każde wywołanie jest cichym brakiem
// operacji. Dzięki temu pomiar nigdy nie wyprzedza zgody i nie trzeba tego
// sprawdzać w każdym miejscu wywołania.

import { captureTouch, campaignLabel, readAttribution } from './attribution'

type GtagParams = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: GtagParams) => void
    fbq?: (command: 'track' | 'trackCustom', name: string, params?: GtagParams) => void
  }
}

export function track(event: string, params?: GtagParams): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  try {
    window.gtag('event', event, params)
  } catch {
    // Pomiar nie może wywrócić ścieżki zapisu.
  }
}

// Zdarzenia standardowe Meta (Lead, CompleteRegistration, Contact...). Meta
// optymalizuje kampanie tylko pod swoje nazwy własne, więc nie da się tu użyć
// polskich nazw zdarzeń GA — stąd osobne wywołanie zamiast jednego wspólnego.
export function trackMeta(event: string, params?: GtagParams): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  try {
    window.fbq('track', event, params)
  } catch {
    // jw.
  }
}

/**
 * Konwersja: to samo zdarzenie w obu systemach naraz.
 *
 * `event` to nasza nazwa dla GA4 (po polsku, jak reszta zdarzeń w lejku),
 * `metaEvent` to nazwa standardowa Meta. Bez `metaEvent` zdarzenie idzie
 * wyłącznie do GA.
 */
export function trackConversion(
  event: string,
  { metaEvent, ...params }: GtagParams & { metaEvent?: string } = {}
): void {
  track(event, params)
  if (metaEvent) trackMeta(metaEvent, params)
}

// Parametry kampanii — zbierane przy wejściu na dowolną stronę publiczną
// (patrz `attribution.ts`) i dopinane do rekordu w `leads`, żeby dało się
// policzyć koszt ucznia z konkretnej reklamy. `ref` to kod polecenia, nie
// kampania płatna, ale trafia do tego samego pola, bo pytanie brzmi tak samo:
// skąd przyszedł ten uczeń.
//
// Czytamy z zapamiętanego dotknięcia, a nie z adresu formularza — inaczej
// ścieżka „reklama → strona główna → /zapisy" gubiła całą atrybucję.
export function readCampaign(): string | null {
  if (typeof window === 'undefined') return null
  // Wywołanie jest idempotentne: jeśli komponent zbierający już zapisał
  // dotknięcie, ta linia tylko je odczyta.
  const attribution = captureTouch() ?? readAttribution()
  if (!attribution) return null
  return campaignLabel(attribution.last) ?? campaignLabel(attribution.first)
}

// Surowy kod polecenia z ?ref=. readCampaign() zwraca etykietę atrybucji
// („polecenie_UNICKANNAR4VW"), a do rejestracji polecenia potrzebny jest kod
// dokładnie taki, jaki nosi uczeń: uNickAnnaR4VW. Kod z adresu ma
// pierwszeństwo, ale przetrwa też przejście przez kilka podstron.
export function readReferralCode(): string | null {
  if (typeof window === 'undefined') return null
  const fromUrl = new URLSearchParams(window.location.search).get('ref')?.trim()
  if (fromUrl) return fromUrl
  const attribution = captureTouch() ?? readAttribution()
  return attribution?.last.ref ?? attribution?.first.ref ?? null
}
