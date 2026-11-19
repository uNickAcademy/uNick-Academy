// Agent Skrzynki: konfiguracja i słownik kategorii.
//
// Agent porządkuje skrzynkę szkoły (IMAP na hostinghouse), odpowiada na maile,
// na które zna odpowiedź, a resztę odkłada do folderu „Do decyzji" i pyta
// człowieka w panelu /admin/skrzynka.
//
// Hasło do skrzynki żyje WYŁĄCZNIE w zmiennych środowiskowych Vercel
// (INBOX_USER / INBOX_PASSWORD). Nie trafia do repo, bazy ani logów.

export type InboxConfig = {
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
  user: string
  password: string
  fromName: string
}

const DEFAULT_HOST = 'u106.hostinghouse.pl'

export function getInboxConfig(): InboxConfig | null {
  const user = process.env.INBOX_USER?.trim()
  const password = process.env.INBOX_PASSWORD
  if (!user || !password) return null
  const imapHost = process.env.INBOX_IMAP_HOST?.trim() || DEFAULT_HOST
  return {
    imapHost,
    imapPort: Number(process.env.INBOX_IMAP_PORT) || 993,
    smtpHost: process.env.INBOX_SMTP_HOST?.trim() || imapHost,
    smtpPort: Number(process.env.INBOX_SMTP_PORT) || 465,
    user,
    password,
    fromName: process.env.INBOX_FROM_NAME?.trim() || 'uNick Academy',
  }
}

export function isInboxConfigured(): boolean {
  return getInboxConfig() !== null
}

// Kategorie = podfoldery w skrzynce. Nazwy folderów bez kropek i ukośników,
// bo to separatory hierarchii IMAP.
export const CATEGORIES = [
  {
    key: 'zapisy',
    folder: 'Zapisy i zapytania',
    description: 'Nowe osoby pytające o zajęcia, ceny, terminy, zapisy, lekcję próbną lub konsultację (dzieci, młodzież, dorośli). Także powiadomienia z formularzy zapisu na stronie.',
  },
  {
    key: 'uczniowie',
    folder: 'Uczniowie i rodzice',
    description: 'Korespondencja z obecnymi uczniami i rodzicami: nieobecności, odrabianie, zmiany terminów, pytania o lekcje, postępy, materiały.',
  },
  {
    key: 'platnosci',
    folder: 'Płatności i faktury',
    description: 'Wpłaty, faktury, rachunki, przypomnienia o płatnościach, księgowość, bank, operatorzy płatności, zwroty.',
  },
  {
    key: 'firmy',
    folder: 'Firmy',
    description: 'Szkolenia językowe dla firm (B2B), oferty i rozmowy z klientami firmowymi.',
  },
  {
    key: 'fundacja',
    folder: 'Fundacja i projekty',
    description: 'uNick Academy Foundation, granty, projekty (np. Kreatorzy Przyszłości), bal charytatywny, darczyńcy, partnerzy projektów.',
  },
  {
    key: 'wideo',
    folder: 'Teachers Videos',
    description: 'Maile od nauczycieli lub kandydatów na nauczycieli z ich nagraniem wideo (intro, przedstawienie się, lekcja pokazowa) w załączniku albo jako link (YouTube, Vimeo, Loom, Google Drive, Dropbox, WeTransfer itp.). Ma pierwszeństwo przed kategorią rekrutacja.',
  },
  {
    key: 'rekrutacja',
    // Folder, który szkoła już ma w skrzynce: agent go nie tworzy, tylko używa.
    folder: 'Teachers Applications',
    description: 'Aplikacje o pracę od nauczycieli i lektorów (często po angielsku): CV, resume, list motywacyjny, „application for a teaching position", zgłoszenia z portali z ofertami pracy, pytania kandydatów o rekrutację. Jeśli kandydat dołącza swoje wideo, wybierz kategorię wideo.',
  },
  {
    key: 'kadra',
    folder: 'Nauczyciele i kadra',
    description: 'Sprawy z nauczycielami i współpracownikami, którzy już u nas pracują: grafiki, zastępstwa, rozliczenia, umowy, sprawy kadrowe. NIE aplikacje o pracę.',
  },
  {
    key: 'urzedy',
    folder: 'Urzędy i formalne',
    description: 'Gmina, urzędy, ZUS, urząd skarbowy, sądy, umowy, pisma prawne, ubezpieczenia, RODO.',
  },
  {
    key: 'systemy',
    folder: 'Systemy i powiadomienia',
    description: 'Automatyczne powiadomienia z narzędzi i serwisów: hosting, domeny, Google, Vercel, Supabase, Stripe, media społecznościowe, kody logowania, raporty.',
  },
  {
    key: 'newslettery',
    folder: 'Newslettery i oferty',
    description: 'Newslettery, mailingi reklamowe, niezamówione oferty handlowe, zaproszenia na webinary, propozycje współpracy marketingowej.',
  },
  {
    key: 'inne',
    folder: 'Inne',
    description: 'Wszystko, co nie pasuje do żadnej z powyższych kategorii.',
  },
] as const

export type CategoryKey = (typeof CATEGORIES)[number]['key']
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as [CategoryKey, ...CategoryKey[]]

export function categoryFolder(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.folder ?? 'Inne'
}

export function categoryLabel(key: string): string {
  return categoryFolder(key)
}

// Folder na maile, przy których agent potrzebuje człowieka. Alfabetycznie
// ląduje na górze listy podfolderów, więc od razu rzuca się w oczy w poczcie.
export const REVIEW_FOLDER = 'Do decyzji'

// Na starsze maile agent już nie odpowiada: tylko je porządkuje. Odpowiedź po
// dwóch tygodniach ciszy wyglądałaby dziwnie i lepiej, żeby zdecydował człowiek.
export const REPLY_WINDOW_DAYS = 10

// Limity jednego przebiegu, żeby zmieścić się w czasie funkcji na Vercel.
export const MAX_REPLY_CANDIDATES_PER_RUN = 12
export const MAX_SORT_ONLY_PER_RUN = 120
export const TRIAGE_BATCH_SIZE = 20
export const RUN_TIME_BUDGET_MS = 230_000

// Folder, którego brakuje, tworzymy obok wskazanego istniejącego folderu,
// żeby foldery rekrutacyjne leżały razem.
export const CREATE_NEXT_TO: Record<string, string> = {
  'Teachers Videos': 'Teachers Applications',
}

// Ile maili-kandydatów sprawdza jedno wywołanie akcji „przenieś wideo".
export const VIDEO_SWEEP_PER_CALL = 60

// Ile maili z odbiorczej przegląda jedno wywołanie akcji „przenieś kategorię".
export const SWEEP_PER_CALL = 160

export const AGENT_HEADER = 'X-uNick-Inbox-Agent'
