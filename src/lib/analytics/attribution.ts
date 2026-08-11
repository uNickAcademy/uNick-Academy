// Atrybucja: skąd naprawdę przyszedł ten lead.
//
// Problem, który to rozwiązuje: parametry kampanii czytaliśmy wyłącznie z
// adresu strony, na której akurat stał formularz. Ktoś, kto kliknął reklamę,
// wylądował na /pl, poczytał i dopiero potem przeszedł na /zapisy, gubił
// utm_* po drodze — lead zapisywał się jako „(brak kampanii)". W praktyce
// tak wygląda większość ścieżek, więc lejek kampanii pokazywał ułamek prawdy.
//
// Teraz dotknięcie kampanii zapisuje się przy wejściu na dowolną stronę
// publiczną i towarzyszy odwiedzającemu aż do wysłania formularza.
//
// Zgoda na cookies: `sessionStorage` używamy zawsze — to jedna wizyta, dane
// nie przeżywają zamknięcia karty i służą wyłącznie do opisania zgłoszenia,
// które użytkownik sam za chwilę wyśle. Do `localStorage` (pamięć między
// wizytami, 90 dni) zapisujemy dopiero po zgodzie na cookies analityczne —
// tak samo jak GA i Meta Pixel.

import { CONSENT_STORAGE_KEY, CONSENT_ALL } from '@/app/lib/cookie-consent'

export type Touch = {
  /** utm_source albo host strony odsyłającej ('google', 'facebook.com'). */
  source: string | null
  /** utm_medium albo 'organic' / 'referral' / 'cpc' wywnioskowane z kliknięcia. */
  medium: string | null
  campaign: string | null
  content: string | null
  term: string | null
  /** Kod polecenia z ?ref=. */
  ref: string | null
  /** Identyfikatory kliknięcia płatnego — same w sobie dowodzą reklamy. */
  gclid: string | null
  fbclid: string | null
  /** Ścieżka, na którą osoba weszła (bez query — bez danych osobowych). */
  landing: string | null
  /** Adres strony odsyłającej, jeśli spoza naszej domeny. */
  referrer: string | null
  /** ISO 8601. */
  at: string
}

export type Attribution = {
  /** Pierwsze dotknięcie — to ono zapoczątkowało znajomość. */
  first: Touch
  /** Ostatnie dotknięcie kampanii — to ono domknęło. */
  last: Touch
}

const STORAGE_KEY = 'unick_attr_v1'
const MAX_AGE_DAYS = 90

// Wyszukiwarki rozpoznawane po hoście — kliknięcie z wyników organicznych to
// inny kanał niż zwykłe odesłanie z cudzej strony.
const SEARCH_HOSTS = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|brave)\./i
const SOCIAL_HOSTS = /(^|\.)(facebook|instagram|linkedin|tiktok|youtube|t|x|twitter)\.(com|co)$/i

function nonEmpty(v: string | null | undefined): string | null {
  const s = (v ?? '').trim()
  return s || null
}

// Host bez „www." — 'www.facebook.com' i 'facebook.com' to ten sam kanał.
function bareHost(host: string): string {
  return host.replace(/^www\./i, '').toLowerCase()
}

function readReferrer(): { host: string; url: string } | null {
  const raw = nonEmpty(document.referrer)
  if (!raw) return null
  try {
    const url = new URL(raw)
    // Ruch wewnętrzny to nie jest nowe źródło.
    if (bareHost(url.hostname) === bareHost(window.location.hostname)) return null
    return { host: bareHost(url.hostname), url: `${url.origin}${url.pathname}` }
  } catch {
    return null
  }
}

// Dotknięcie z bieżącego adresu. `null`, gdy adres nie niesie żadnego
// znacznika kampanii — wtedy dopiero patrzymy na stronę odsyłającą.
function touchFromUrl(): Touch | null {
  const p = new URLSearchParams(window.location.search)
  const utmSource = nonEmpty(p.get('utm_source'))
  const utmMedium = nonEmpty(p.get('utm_medium'))
  const campaign = nonEmpty(p.get('utm_campaign'))
  const content = nonEmpty(p.get('utm_content'))
  const term = nonEmpty(p.get('utm_term'))
  const ref = nonEmpty(p.get('ref'))
  const gclid = nonEmpty(p.get('gclid'))
  const fbclid = nonEmpty(p.get('fbclid'))

  if (!utmSource && !utmMedium && !campaign && !content && !term && !ref && !gclid && !fbclid) {
    return null
  }

  // Sam gclid/fbclid bez utm to i tak kliknięcie płatne — reklamodawca
  // dokleja je automatycznie, nawet gdy ktoś zapomni otagować linku.
  const source = utmSource ?? (gclid ? 'google' : fbclid ? 'facebook' : ref ? 'polecenie' : null)
  const medium = utmMedium ?? (gclid || fbclid ? 'cpc' : ref ? 'referral' : null)

  return {
    source, medium, campaign, content, term, ref, gclid, fbclid,
    landing: window.location.pathname,
    referrer: readReferrer()?.url ?? null,
    at: new Date().toISOString(),
  }
}

// Dotknięcie wywnioskowane ze strony odsyłającej — ruch organiczny i zwykłe
// linki z cudzych stron. Bez tego wszystko, co nie jest reklamą, wygląda na
// „wejście z powietrza".
function touchFromReferrer(): Touch | null {
  const referrer = readReferrer()
  if (!referrer) return null

  const medium = SEARCH_HOSTS.test(referrer.host)
    ? 'organic'
    : SOCIAL_HOSTS.test(referrer.host)
      ? 'social'
      : 'referral'
  // Dla wyszukiwarek nazwa silnika czyta się lepiej niż pełny host.
  const source = medium === 'organic' ? referrer.host.split('.')[0] : referrer.host

  return {
    source, medium,
    campaign: null, content: null, term: null, ref: null, gclid: null, fbclid: null,
    landing: window.location.pathname,
    referrer: referrer.url,
    at: new Date().toISOString(),
  }
}

function isFresh(touch: Touch): boolean {
  const age = Date.now() - new Date(touch.at).getTime()
  return Number.isFinite(age) && age >= 0 && age < MAX_AGE_DAYS * 24 * 60 * 60 * 1000
}

function parse(raw: string | null): Attribution | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Attribution
    if (!parsed?.first?.at || !parsed?.last?.at) return null
    // Wygasłe dotknięcie nie opisuje już niczego sensownego.
    return isFresh(parsed.first) || isFresh(parsed.last) ? parsed : null
  } catch {
    return null
  }
}

function hasAnalyticsConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === CONSENT_ALL
  } catch {
    return false
  }
}

/** Zapamiętane dotknięcia: sesja ma pierwszeństwo, potem pamięć długoterminowa. */
export function readAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null
  try {
    return parse(window.sessionStorage.getItem(STORAGE_KEY))
      ?? parse(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    // Tryb prywatny bez dostępu do storage — pomiar nie może wywrócić strony.
    return null
  }
}

function write(value: Attribution): void {
  const raw = JSON.stringify(value)
  try {
    window.sessionStorage.setItem(STORAGE_KEY, raw)
  } catch {
    /* brak storage — trudno, zostaje odczyt z adresu */
  }
  if (!hasAnalyticsConsent()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, raw)
  } catch {
    /* jw. */
  }
}

/**
 * Zapisuje dotknięcie dla bieżącej odsłony. Wywoływane przy wejściu na każdą
 * stronę publiczną — kolejne odsłony bez znaczników kampanii niczego nie psują.
 *
 * Reguła: `first` zapisuje się raz i nigdy nie jest nadpisywane; `last`
 * przesuwa się tylko wtedy, gdy pojawia się nowe, konkretne źródło. Zwykłe
 * klikanie po serwisie nie kasuje kampanii, z której ktoś przyszedł.
 */
export function captureTouch(): Attribution | null {
  if (typeof window === 'undefined') return null

  const stored = readAttribution()
  const incoming = touchFromUrl() ?? (stored ? null : touchFromReferrer())
  if (!incoming) {
    // Nic nowego, ale zgoda mogła zapaść po zapisaniu dotknięcia do sesji —
    // przenosimy je wtedy do pamięci długoterminowej.
    if (stored) write(stored)
    return stored
  }

  const next: Attribution = stored
    ? { first: stored.first, last: incoming }
    : { first: incoming, last: incoming }
  write(next)
  return next
}

// Etykieta kampanii zapisywana w `leads.campaign`. Format zostaje zgodny z
// tym, co już siedzi w bazie i w widoku `v_lead_funnel` ("źródło:kampania",
// "polecenie_KOD"), żeby stare i nowe rekordy dawały się grupować razem.
export function campaignLabel(touch: Touch | null | undefined): string | null {
  if (!touch) return null
  if (touch.campaign) return touch.source ? `${touch.source}:${touch.campaign}` : touch.campaign
  if (touch.ref) return `polecenie_${touch.ref.toUpperCase()}`
  if (touch.source) return touch.medium ? `${touch.source}:${touch.medium}` : touch.source
  return null
}
