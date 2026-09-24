/**
 * Wyłącznik automatycznych wysyłek do uczniów i rodziców.
 *
 * `true` = z harmonogramu nie wychodzi do nich ani jedna wiadomość.
 *
 * Dotyczy WYŁĄCZNIE wysyłek, które startują z crona, czyli takich, których
 * nikt ze szkoły nie zlecił i o których nikt nie wie, że właśnie poszły:
 * przypomnienie o lekcji, przypomnienie o odrabianiu, windykacja, tygodniowe
 * podsumowanie postępów, mail przygotowawczy przed pierwszymi zajęciami,
 * przypomnienie o starcie grupy oraz miesięczny rachunek z linkiem do płatności.
 *
 * NIE dotyczy i dalej działa:
 *  - wysyłki z panelu (/admin/komunikacja) — te zleca człowiek,
 *  - odpowiedzi na czyjeś działanie: zgłoszenie nieobecności, propozycja
 *    odrabiania, potwierdzenie wpłaty,
 *  - maili logowania i resetu hasła.
 *
 * Zastąpił wcześniejszą flagę LESSON_REMINDERS_PAUSED, która wyciszała tylko
 * dwie z siedmiu wysyłek. Jedno miejsce zamiast kilku znaczy, że da się
 * odpowiedzieć na pytanie „czy coś dziś wyszło do uczniów" bez czytania crona.
 *
 * Włączenie z powrotem: zmień na `false` i wdróż. Zanim to zrobisz, sprawdź
 * salda — przy wyłączonych wysyłkach naliczenia miesięczne lecą dalej, więc
 * windykacja ruszyłaby od razu z kwotami uzbieranymi przez cały okres ciszy.
 */
export const AUTOMATIC_MESSAGES_PAUSED = true
