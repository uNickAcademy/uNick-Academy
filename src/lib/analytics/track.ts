// Zdarzenia konwersji dla GA4.
//
// Skrypt GA ładuje się dopiero po zgodzie na analityczne cookies (komponent
// GoogleAnalytics reaguje na baner), więc przed zgodą `window.gtag` po prostu
// nie istnieje i każde wywołanie jest cichym brakiem operacji. Dzięki temu
// pomiar nigdy nie wyprzedza zgody i nie trzeba tego sprawdzać w każdym miejscu
// wywołania.

type GtagParams = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: GtagParams) => void
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

// Parametry kampanii z adresu — zbierane raz, na wejściu do kreatora, i
// dopinane do rekordu w `leads`, żeby dało się policzyć koszt ucznia z
// konkretnej reklamy. `ref` to kod polecenia, nie kampania płatna, ale trafia
// do tego samego pola, bo pytanie brzmi tak samo: skąd przyszedł ten uczeń.
// Surowy kod polecenia z ?ref=. readCampaign() zwraca etykietę atrybucji
// („polecenie_UNICKANNAR4VW"), a do rejestracji polecenia potrzebny jest kod
// dokładnie taki, jaki nosi uczeń: uNickAnnaR4VW.
export function readReferralCode(): string | null {
  if (typeof window === 'undefined') return null
  const ref = new URLSearchParams(window.location.search).get('ref')?.trim()
  return ref || null
}

export function readCampaign(): string | null {
  if (typeof window === 'undefined') return null
  const p = new URLSearchParams(window.location.search)
  const campaign = p.get('utm_campaign')?.trim()
  const source = p.get('utm_source')?.trim()
  if (campaign) return source ? `${source}:${campaign}` : campaign
  if (source) return source
  const ref = p.get('ref')?.trim()
  return ref ? `polecenie_${ref.toUpperCase()}` : null
}
