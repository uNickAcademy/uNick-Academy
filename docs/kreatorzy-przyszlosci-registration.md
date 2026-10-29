# Rejestracja „Kreatorzy Przyszłości”

## Cel

Formularz na `/creators#deklaracja` przyjmuje zgłoszenia chęci udziału w bezpłatnych zajęciach dla osób w wieku 10–18 lat. Uczestnik musi mieszkać w gminie Tarnowo Podgórne, Rokietnica, Kaźmierz lub Szamotuły. Lista zajęć jest automatycznie ograniczana według wieku obliczonego na 1 listopada 2026 r. Wysłanie formularza nie gwarantuje miejsca.

## Przepływ danych

- `FoundationInterestForm` zbiera dane i wysyła je do `/api/foundation-interest`.
- API ponownie oblicza wiek i waliduje gminę, zajęcia, zgody oraz pola antyspamowe.
- Gmina zamieszkania i gmina zajęć są niezależne. W punkcie 2 rodzic może wybrać inną gminę; kursy i terminy zależą od gminy zajęć oraz wieku, a prawo udziału nadal wymaga zamieszkania w jednej z czterech gmin.
- `municipality` zachowuje gminę zamieszkania, natomiast istniejące `primary_location` i `preferred_locations` przechowują wybrane miejsce zajęć. Panel szczegółów i CSV pokazują oba pola oddzielnie. Brak nowego pola w żądaniu ze starszej otwartej karty zachowuje dotychczasowe znaczenie (zajęcia w gminie zamieszkania); jawnie pusty lub nieprawidłowy wybór jest odrzucany.
- Zgłoszenie trafia do istniejącej tabeli `foundation_interest_declarations`; nie jest potrzebna migracja ani usuwanie danych historycznych.
- Data urodzenia, potwierdzenie miejsca zamieszkania i potrzeby dostępności są zapisane w wersjonowanej kopercie kompatybilności. Starsze zwykłe notatki pozostają czytelne.
- Istniejący panel `/admin/fundacja` i eksport CSV pokazują kolejność zgłoszeń, dane rekrutacyjne oraz preferowaną dostępność.
- Potwierdzenia i powiadomienia korzystają z istniejącego mechanizmu e-mail; brak konfiguracji e-mail nie blokuje bezpiecznego zapisu zgłoszenia.

## Statystyki administracyjne

Panel `/admin/fundacja` i CSV używają wspólnego `buildFoundationStatistics`: liczba zgłoszeń jest oddzielna od liczby wskazań zajęć, ponieważ jedno zgłoszenie może wskazać kilka kursów. Każdy kurs ma osobny licznik zainteresowania i pierwszego wyboru. Statystyki lokalizacji odnoszą się do pola gminy zamieszkania, nie do preferowanego miejsca zajęć. Brak danych pozostaje osobną kategorią.

`listFoundationDeclarations` pobiera wszystkie strony danych w stabilnej kolejności. Błąd dowolnej strony przerywa odczyt zamiast pokazywać niepełne wyniki. Panel odświeża się co minutę przy widocznej zakładce, po powrocie do niej i ręcznie. Limit 12 osób w grupie nie oznacza przydzielenia miejsc: deklarowane zainteresowanie nie jest potwierdzeniem konkretnej grupy.

## Rozszerzanie konfiguracji

- Zajęcia, przedziały wiekowe, gminy, dni i godziny są konfigurowane w `src/lib/foundation/options.ts`.
- Potwierdzone terminy i adresy są w `src/lib/foundation/schedule.ts`. Ten sam harmonogram zasila stronę `/creators` i opisy kursów w formularzu. Brak potwierdzenia sali lub godziny pozostaje jawny; nie zastępujemy go zgadywanym adresem. Powiązania kursów z gminami w `options.ts` muszą odpowiadać temu harmonogramowi.
- Nowy format szczegółów zgłoszenia wymaga nowej wartości `FOUNDATION_RECORD_SCHEMA` i zgodnego odczytu poprzednich wersji w `src/lib/foundation/record.ts`.
- Jeśli zakres rekrutacji zacznie wymagać nowych zapytań lub raportów, należy dodać osobne kolumny w kontrolowanej migracji zamiast rozszerzać kopertę JSON.
