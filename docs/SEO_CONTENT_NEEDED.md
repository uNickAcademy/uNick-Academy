# Brakujące dane do uzupełnienia (SEO / treści)

Poniższych danych **nie wymyślono** — trzeba je potwierdzić i uzupełnić przed
publikacją odpowiednich elementów. Do czasu uzupełnienia nie renderujemy
widocznych placeholderów na stronie.

## Dane firmy / kontakt

| Dane | Status | Gdzie użyć |
| --- | --- | --- |
| Telefon `+48 666 661 750` | ✅ potwierdzone przez właściciela | `site-config.js`, kontakt, JSON-LD, llms.txt |
| Adres: Nowa 23, Rumianek, 62-080 Tarnowo Podgórne | ✅ z briefu | NAP wszędzie |
| E-mail `hello@unick-academy.pl` | ✅ z `site-config` | kontakt, JSON-LD |
| NIP `7812067015` | ✅ uzupełnione (polityka prywatności PL/EN + JSON-LD `taxID`/`vatID`) | stopka prawna, faktury |
| **Godziny otwarcia / kontaktu** | ❌ brak potwierdzenia | JSON-LD `openingHoursSpecification`, kontakt |
| **Współrzędne geo (lat/lng)** | ❌ nie zgadujemy | JSON-LD `geo`, precyzyjny pin mapy |
| **Google Business Profile Place ID / link do profilu** | ❌ brak | embed mapy z pinem, `sameAs` |
| **Parking / dostępność wejścia** | ❌ brak potwierdzenia | sekcja dojazdu na stronie lokalnej/kontakt |

## Oferta / zajęcia

Na stronach oferty i lokalnej brakuje konkretów, które warto pokazać (i które
poprawiają widoczność w AI/Google). Uzupełnić, jeśli dane są aktualne:

- ceny lub ceny „od” (dzieci / młodzież / dorośli / indywidualne / firmy),
- długość i częstotliwość spotkań,
- wielkość grup (konkretne widełki),
- aktualny plan/harmonogram zajęć,
- poziomy CEFR w ofercie,
- terminy naborów,
- konkretni nauczyciele przypisani do grup wiekowych.

> Gdy dane będą dostępne, dodać komponent „szczegóły zajęć” (widoczny w HTML,
> nie chowany w akordeonie) na stronach oferty i lokalnej oraz rozszerzyć
> JSON-LD `Course`/`Offer`.

## Media (zdjęcia / wideo)

- Prawdziwe zdjęcie **wejścia/budynku** i **sali** w Rumianku → strona kontaktu
  i lokalna (obecnie hero kontaktu używa dekoracyjnego `PlaceholderMedia`).
- Zdjęcia nauczycieli: obecnie linkowane ze starej domeny
  `unickacademy.pl/wp-content/uploads/...` (`src/app/lib/teachers.js`). **Przenieść
  do `public/` lub Supabase** przed wygaszeniem starej domeny — inaczej zdjęcia
  przestaną się ładować.
- Materiały case study (np. „100 Day Language Transformation”): punkt wyjścia,
  cel, czas trwania, mierzalne zmiany, cytaty ucznia/nauczyciela, link do playlisty.

## Opinie

- Prawdziwe opinie lokalnych klientów (za zgodą) → sekcja opinii + oznaczenie jako
  opinie klientów. **Nie** dodawać `aggregateRating`/`Review` do JSON-LD firmy na
  podstawie własnych publikacji, dopóki nie spełnia to wytycznych Google.
