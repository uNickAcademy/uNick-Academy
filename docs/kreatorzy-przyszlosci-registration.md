# Rejestracja „Kreatorzy Przyszłości”

## Cel

Formularz na `/creators#deklaracja` przyjmuje zgłoszenia chęci udziału w bezpłatnych zajęciach dla osób w wieku 10–18 lat. Uczestnik musi mieszkać w gminie Tarnowo Podgórne, Rokietnica, Kaźmierz lub Szamotuły. Lista zajęć jest automatycznie ograniczana według wieku obliczonego na 1 listopada 2026 r. Wysłanie formularza nie gwarantuje miejsca.

## Przepływ danych

- `FoundationInterestForm` zbiera dane i wysyła je do `/api/foundation-interest`.
- API ponownie oblicza wiek i waliduje gminę, zajęcia, zgody oraz pola antyspamowe.
- Zgłoszenie trafia do istniejącej tabeli `foundation_interest_declarations`; nie jest potrzebna migracja ani usuwanie danych historycznych.
- Data urodzenia, potwierdzenie miejsca zamieszkania i potrzeby dostępności są zapisane w wersjonowanej kopercie kompatybilności. Starsze zwykłe notatki pozostają czytelne.
- Istniejący panel `/admin/fundacja` i eksport CSV pokazują kolejność zgłoszeń, dane rekrutacyjne oraz preferowaną dostępność.
- Potwierdzenia i powiadomienia korzystają z istniejącego mechanizmu e-mail; brak konfiguracji e-mail nie blokuje bezpiecznego zapisu zgłoszenia.

## Rozszerzanie

- Zajęcia, przedziały wiekowe, gminy, dni i godziny są konfigurowane w `src/lib/foundation/options.ts`.
- Nowy format szczegółów zgłoszenia wymaga nowej wartości `FOUNDATION_RECORD_SCHEMA` i zgodnego odczytu poprzednich wersji w `src/lib/foundation/record.ts`.
- Jeśli zakres rekrutacji zacznie wymagać nowych zapytań lub raportów, należy dodać osobne kolumny w kontrolowanej migracji zamiast rozszerzać kopertę JSON.
