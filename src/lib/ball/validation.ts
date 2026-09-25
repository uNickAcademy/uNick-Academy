import { BALL, MAX_PER_KIND, summarise, type TicketCounts } from './event'

/**
 * Walidacja zgłoszenia na bal po stronie serwera.
 *
 * Wszystko, co sprawdza formularz w przeglądarce, jest tu sprawdzane jeszcze
 * raz: przeglądarka jest tylko wygodą, nie zabezpieczeniem. Kwota i liczba
 * miejsc są LICZONE tutaj z wybranych biletów, a nie przyjmowane z żądania —
 * inaczej dałoby się zgłosić dziesięć miejsc za trzysta złotych.
 *
 * Wzorzec (ukryta pułapka + minimalny czas wypełniania `startedAt`) jest
 * ten sam co w deklaracjach Fundacji, żeby oba formularze broniły się tak samo.
 */

export type BallRegistration = {
  counts: TicketCounts
  seats: number
  amount: number
  guests: string[]
  contactName: string
  email: string
  phone: string
  tableRequest: string | null
  dietaryNotes: string | null
  dietaryConsent: boolean
  termsVersion: string
}

type Result =
  | { ok: true; data: BallRegistration }
  | { ok: false; errors: Record<string, string> }

const text = (value: unknown, max = 200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const count = (value: unknown) => {
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 && n <= MAX_PER_KIND ? n : null
}

/** Ten sam format co w deklaracjach Fundacji: +48 i dziewięć cyfr. */
export function normalizePolishPhone(value: unknown): string | null {
  const cleaned = text(value, 40).replace(/[^0-9+]/g, '').replace(/^0048/, '+48')
  const number = cleaned.startsWith('+48') ? cleaned.slice(3) : cleaned
  return /^\d{9}$/.test(number) ? `+48${number}` : null
}

export function validateBallRegistration(input: unknown): Result {
  const values = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const errors: Record<string, string> = {}

  // Pułapka na boty: pole ukryte przed człowiekiem, wypełniane przez skrypty.
  //
  // Nazwa jest celowo bez znaczenia. Wcześniej pole nazywało się „website"
  // i Chrome autouzupełniał je adresem ze swojego profilu razem z resztą
  // formularza — prawdziwe zgłoszenia leciały do kosza razem z botami.
  //
  // Komunikat podaje kontakt, bo gdyby pułapka kiedyś znowu zadziałała na
  // człowieka, nie może zostawić go w ślepym zaułku.
  const trap = 'Nie udało się wysłać zgłoszenia. Odśwież stronę i spróbuj ponownie, '
    + 'a jeśli to nie pomoże, napisz na hello@unick-academy.pl.'
  if (text(values.uniBallPotwierdzenie)) errors.form = trap
  const startedAt = Number(values.startedAt)
  if (!startedAt || Date.now() - startedAt < 2500 || Date.now() - startedAt > 86_400_000) {
    errors.form = trap
  }

  const single = count(values.singleTickets)
  const couple = count(values.coupleTickets)
  if (single === null || couple === null) {
    errors.tickets = `Wybierz od 0 do ${MAX_PER_KIND} biletów każdego rodzaju.`
  } else if (single + couple === 0) {
    errors.tickets = 'Wybierz co najmniej jeden bilet.'
  }

  const counts: TicketCounts = { single: single ?? 0, couple: couple ?? 0 }
  const { seats, amount } = summarise(counts)

  // Imiona i nazwiska gości: dokładnie tyle wpisów, ile wykupionych miejsc.
  const rawGuests = Array.isArray(values.guests) ? values.guests : []
  const guests = rawGuests.map((g) => text(g, 120)).filter(Boolean)
  if (!errors.tickets) {
    if (guests.length !== seats) {
      errors.guests = `Podaj imiona i nazwiska wszystkich gości (${seats}).`
    } else if (guests.some((g) => g.length < 3)) {
      errors.guests = 'Każdy gość potrzebuje imienia i nazwiska.'
    }
  }

  const contactName = text(values.contactName, 120)
  const email = text(values.email, 254).toLowerCase()
  const phone = normalizePolishPhone(values.phone)
  if (contactName.length < 3) errors.contactName = 'Podaj imię i nazwisko osoby zgłaszającej.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Podaj poprawny adres e-mail.'
  if (!phone) errors.phone = 'Podaj polski numer telefonu.'

  const tableRequest = text(values.tableRequest, 600) || null
  const dietaryNotes = text(values.dietaryNotes, 600) || null
  const dietaryConsent = values.dietaryConsent === true

  // Potrzeby żywieniowe potrafią ujawnić dane o zdrowiu (§8 ust. 2 regulaminu),
  // więc bez osobnej zgody nie wolno ich w ogóle zapisać.
  if (dietaryNotes && !dietaryConsent) {
    errors.dietaryConsent = 'Zaznacz zgodę, żebyśmy mogli przekazać te informacje hotelowi.'
  }

  if (values.termsAccepted !== true) errors.termsAccepted = 'Akceptacja regulaminu jest wymagana.'
  if (values.privacyAcknowledged !== true) {
    errors.privacyAcknowledged = 'Potwierdzenie informacji o danych jest wymagane.'
  }

  if (Object.keys(errors).length) return { ok: false, errors }

  return {
    ok: true,
    data: {
      counts,
      seats,
      amount,
      guests,
      contactName,
      email,
      phone: phone!,
      tableRequest,
      dietaryNotes,
      dietaryConsent: dietaryNotes ? true : false,
      termsVersion: BALL.termsVersion,
    },
  }
}
