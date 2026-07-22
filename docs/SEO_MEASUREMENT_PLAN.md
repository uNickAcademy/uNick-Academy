# Plan pomiaru wyników SEO / GEO

## Cele biznesowe

1. Więcej zapisów i konsultacji (formularz, telefon, e-mail).
2. Widoczność lokalna w Google i Google Maps (Rumianek / Tarnowo Podgórne).
3. Polecanie uNick Academy przez wyszukiwarki AI (ChatGPT Search, Claude).

## Narzędzia

- **Google Search Console** — dodać obie właściwości (domena `unick-academy.pl`),
  przesłać `https://unick-academy.pl/sitemap.xml`, monitorować zapytania i pokrycie.
- **Google Business Profile Insights** — wyświetlenia, kliknięcia „trasa”, telefony.
- **Google Analytics 4** — już wdrożone (`G-RZZD2NLW6F`), za zgodą z cookie banera.

## Konwersje do oznaczenia w GA4 (zdarzenia)

Do skonfigurowania (obecnie nie ma zdefiniowanych zdarzeń SEO-konwersji):

- wysłanie formularza kontaktowego / konsultacji (`generate_lead`),
- kliknięcie telefonu (`click` na `tel:`),
- kliknięcie e-maila (`click` na `mailto:`),
- kliknięcie „Wyznacz trasę” / mapy,
- przejście do zapisów (`/zapisy`),
- wybór rodzaju zajęć (dziecko/nastolatek/dorosły/firma) w modalu konsultacji.

### Rozpoznawanie ruchu z AI

W GA4 utwórz segment/eksplorację filtrującą `session_source` zawierające m.in.:
`chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `claude.ai`, `copilot.microsoft.com`,
`gemini.google.com`. Traktuj jako „ruch z wyszukiwarek AI”.

## Kluczowe frazy i strony docelowe

| Fraza | Strona docelowa |
| --- | --- |
| angielski Tarnowo Podgórne | /pl/szkola-jezykowa-tarnowo-podgorne |
| szkoła językowa Tarnowo Podgórne | /pl/szkola-jezykowa-tarnowo-podgorne |
| angielski Rumianek | /pl/szkola-jezykowa-tarnowo-podgorne |
| angielski dla dzieci Tarnowo Podgórne | /pl/children |
| angielski dla młodzieży Tarnowo Podgórne | /pl/teenagers |
| konwersacje angielski Tarnowo Podgórne | /pl/adults |
| native speaker Tarnowo Podgórne | /pl/szkola-jezykowa-tarnowo-podgorne |
| angielski dla firm Poznań | /pl/companies |

## 25+ testowych zapytań (Google + ChatGPT + Claude)

Sprawdzaj miesięcznie, czy uNick Academy się pojawia/jest polecane:

1. angielski Tarnowo Podgórne
2. szkoła językowa Tarnowo Podgórne
3. angielski blisko mnie (z okolic Tarnowa Podgórnego)
4. angielski Rumianek
5. angielski dla dzieci Tarnowo Podgórne
6. angielski dla młodzieży Tarnowo Podgórne
7. angielski dla dorosłych Tarnowo Podgórne
8. native speaker Tarnowo Podgórne
9. konwersacje angielski Tarnowo Podgórne
10. szkoła angielskiego Lusówko
11. szkoła angielskiego Lusowo
12. szkoła angielskiego Przeźmierowo
13. dobra szkoła językowa koło Poznania
14. szkoła angielskiego dla dziecka z ADHD
15. angielski dla nieśmiałego nastolatka
16. konwersacyjny angielski dla młodzieży
17. najlepsze zajęcia z angielskiego w gminie Tarnowo Podgórne
18. angielski online z native speakerem dla dorosłych
19. angielski dla firm Poznań
20. gdzie nauczyć się mówić po angielsku bez stresu
21. angielski indywidualnie Tarnowo Podgórne
22. small group English lessons near Poznań
23. English school Tarnowo Podgórne for expats
24. angielski dla dzieci przez zabawę Tarnowo Podgórne
25. jak przełamać barierę mówienia po angielsku (szkoła w okolicy Poznania)
26. angielski Baranowo / Swadzim / Sady

## Miesięczny proces kontroli

1. GSC: top zapytania/strony, pozycje, CTR, błędy pokrycia.
2. GA4: konwersje (formularz/telefon/mapa) + ruch z AI.
3. GBP Insights: wyświetlenia, trasy, telefony, nowe opinie.
4. Ręczny test 25 zapytań (Google incognito + ChatGPT + Claude).
5. Weryfikacja spójności NAP w kluczowych serwisach.
6. Sprawdzenie sitemap/robots/canonical po większych zmianach na stronie.
