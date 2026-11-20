# Potwierdzenia i umowy — Kreatorzy Przyszłości

Panel: `/admin/fundacja/umowy`; formularz rodzica: `/uczestnictwo#token=…`.

Administrator wybiera istniejące zgłoszenie i aktualny przydział z arkusza. Dziewięć grup sezonu grudzień 2026–kwiecień 2027 ma osobny katalog; źródłowe deklaracje i pierwotne preferencje pozostają zachowane. Początek wsparcia zależy od dnia grupy: 1, 2 lub 3 grudnia. API sprawdza imię i nazwisko, daty i grupy; baza pilnuje limitu 12 aktywnych przydziałów, również przy równoczesnych żądaniach.

Rodzic potwierdza miejsce i termin albo zgłasza potrzebę kontaktu. Dopiero odpowiedź „tak” otwiera dane i umowę. Dorosły uczestnik podpisuje samodzielnie. Wiek liczony jest na pierwsze wsparcie; data urodzenia nie trafia do zapisu umowy. PDF zawiera umowę, informacje Fundacji, pełną klauzulę LGD po jej skonfigurowaniu, uzupełniony oryginalny formularz LGD nr 7 i informację Województwa. Potrzeb dostępności w formularzu LGD nie zaznaczamy za rodzica.

Po otrzymaniu ostatecznych dokumentów rodzic podpisuje je, wysyła skan na skonfigurowany adres i dostarcza oryginał na pierwsze zajęcia. Administrator osobno potwierdza skan i oryginał. Kliknięcie potwierdzeń ani pobranie PDF nie oznacza odebrania podpisanych dokumentów. Ochrona małoletnich, upoważnienia do odbioru i ewentualne dobrowolne zgody publikacyjne są osobnymi procesami.

## Uzupełnienie danych projektu

Przed ostatecznymi umowami należy wpisać numer z podpisanej umowy grantowej, właściwy okres archiwizacji, pełną informację LGD i rzeczywiste informacje o dostawcach/przekazywaniu danych. Nie zastępuj numeru grantu numerem projektu parasolowego ani numerem zadania. Regulamin publiczny zawiera alternatywne sposoby liczenia archiwizacji; wybór wymaga podpisanej umowy.

Administrator może jawnie wybrać **wersję do sprawdzenia** mimo brakujących danych. Rodzic i każda strona PDF otrzymują oznaczenie „do uzupełnienia”; brak numeru ma etykietę „DO UZUPEŁNIENIA”. Ostateczne dokumenty nadal wymagają kompletnej konfiguracji. Dotyczy to również zaproszenia testowego dla rodzica Bena Rudd — nie udajemy kompletu informacji LGD. Po uzupełnieniu danych należy wycofać wcześniejszy link i utworzyć nową wersję; historia odpowiedzi i dokumentów pozostaje.

## Bezpieczeństwo i historia

- Oddzielne tabele zaproszeń, odpowiedzi, umów i konfiguracji. Bez zmian w źródłowych deklaracjach.
- 256-bitowy sekret jest tylko we fragmencie indywidualnego linku; w bazie przechowywany jest SHA-256. Link wygasa po 30 dniach i może zostać wycofany.
- RLS: administrator odczytuje dane, rodzic korzysta wyłącznie z serwerowych tras z sekretem. Klucz uprzywilejowany pozostaje na serwerze. Trasy i PDF mają `no-store` i `no-referrer`.
- Odpowiedź na termin jest niezmienna. Korekta tworzy nowe zaproszenie. Dane, dokładna wersja dokumentów, PDF i jego hash są zapisywane raz; ponowienie pobiera te same bajty.
- Brak PESEL-u, dokładnego adresu, diagnoz i wymuszonych zgód promocyjnych. CSV kontaktowy zabezpiecza przed formułami i wybiera najnowszą wersję na zgłoszenie.
- Interfejs przygotowuje wiadomość do skopiowania; sam nie wysyła kampanii. Wysyłka wymaga osobnej dyspozycji.

## Źródła i wydanie

Materiały LGD: https://dolinasamy.pl/nabor-nr-20906adsgrantyefs.html — pakiet startowy, załącznik 7, umowa grantowa (ochrona danych w §20, archiwizacja §6). Kalendarz: https://www.gov.pl/web/cea/kalendarz-roku-szkolnego. Oryginały szablonów PDF przechowujemy w `assets/foundation-contract`; oryginalne DOCX są w pakiecie materiałów projektu. W regionalnej informacji uzupełniono numer projektu parasolowego i LGD jako jego beneficjenta. Nie są to numery indywidualnego grantu Fundacji.

Zastosować wyłącznie migracje `foundation_participant_contracts` oraz `foundation_confirmation_responses` z tego wydania. Nie uruchamiać automatycznie innych zaległych migracji repozytorium. Pliki PDF/fonty są jawnie dodane do śladu funkcji Vercel.

Sprawdzenia: `node tests/foundation-contracts.cjs`, `node tests/foundation-contract-database.mjs` (PGlite w `PGLITE_MODULE`), TypeScript, lint zmienionych tras i komponentów, produkcyjny build oraz wizualny przegląd PDF. PGlite weryfikuje RLS, blokadę bez potwierdzenia terminu, niezmienność odpowiedzi, powtórzenia, odwołanie/wygaśnięcie, oddzielenie skanu od oryginału i limit 12 miejsc.
