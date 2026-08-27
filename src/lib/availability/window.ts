// Okno, w którym formularz jest otwarty. Nabór trwa jeden tydzień we wrześniu;
// po tym terminie strona pokazuje komunikat zamiast formularza, a endpoint
// odrzuca zgłoszenia (zamknięcie musi być egzekwowane po stronie serwera —
// strona bywa zbuforowana w przeglądarce).
//
// 7.09.2026, godz. 23:59:59 czasu polskiego (UTC+2 we wrześniu).
export const FORM_CLOSES_AT = Date.parse('2026-09-07T21:59:59.999Z')

/** Data zamknięcia w formie do wyświetlenia w treści strony. */
export const FORM_CLOSES_LABEL = '7 września 2026'

export function isFormOpen(now: number = Date.now()): boolean {
  return now <= FORM_CLOSES_AT
}
