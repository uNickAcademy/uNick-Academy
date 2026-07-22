# uNick Academy — Audyt SEO (stan początkowy)

Data audytu: 2026-07-22
Zakres: część publiczna (marketingowa) strony `unick-academy.pl` w repozytorium.

## Wykryty stack

- **Framework:** Next.js 15.5 (App Router), React 19.
- **Język:** JavaScript (marketing) + TypeScript (panele/API).
- **Routing marketingu:** `src/app/[locale]/…` z `generateStaticParams` dla `pl` i `en`.
- **Tłumaczenia:** słowniki `src/app/lib/dictionaries/{pl,en}.js` (synchroniczne, ta sama struktura kluczy).
- **Konfiguracja marki:** `src/app/lib/site-config.js`.
- **Middleware:** `src/middleware.ts` (auth Supabase, runtime Node.js).
- **Hosting:** Vercel (deploy z `main`), `vercel.json` (crony).
- **Analityka:** Google Analytics 4 (`G-RZZD2NLW6F`) za zgodą z cookie banera.

## Publiczne trasy (przed zmianami)

`/[locale]` oraz podstrony: `children`, `teenagers`, `adults`, `companies`,
`how-we-teach`, `meet-us`, `contact`, `teachers-zone`, `meet-unickorn`,
`privacy-policy`, `terms-of-service`. `/` → 307 na `/pl`.

## Najważniejsze problemy wykryte na starcie

| Obszar | Stan początkowy | Priorytet |
| --- | --- | --- |
| **Brak `robots.txt`** | Nie istniał żaden plik robots — brak polityki dla botów AI/wyszukiwarek, brak wskazania sitemap. | Wysoki |
| **Brak `sitemap.xml`** | Nie istniała sitemapa. | Wysoki |
| **Canonical** | Podstrony `generateMetadata` zwracały tylko `dict.X.meta` (title+description). Brak `alternates.canonical` — dziedziczyły canonical z layoutu (strona główna) → ryzyko kanonizacji wszystkich stron do `/`. | Wysoki |
| **hreflang** | Layout ustawiał jedynie `languages: { en:'/en', pl:'/pl' }` dla strony głównej, bez `x-default` i bez per-page. Podstrony nie miały wzajemnych hreflang. | Wysoki |
| **Brak danych strukturalnych** | Zero JSON-LD (Organization, LocalBusiness, WebSite, WebPage, FAQ, Course). | Wysoki |
| **Brak sygnałów lokalnych** | Strona główna i podstrony nie wspominały Rumianka / Tarnowa Podgórnego. Brak NAP (adres, telefon) w treści. | Wysoki |
| **Widoczny placeholder** | Strona kontaktu renderowała `PlaceholderMedia` z podpisem „Lokalizacja — mapa / placeholder studia”. Adres i telefon nie były renderowane jako tekst HTML. | Wysoki |
| **Brak lokalnej strony docelowej** | Nie istniała strona typu „szkoła językowa Tarnowo Podgórne”. | Wysoki |
| **Meta titles/descriptions** | Ogólne, bez fraz lokalnych i bez podkreślenia native speakerów. | Średni |
| **Stara domena** | `unickacademy.pl` (bez myślnika) używana jako źródło zdjęć nauczycieli (`teachers.js`) — dopuszczalne dla assetów, ale wymaga uwagi przy migracji. Brak mapy przekierowań ze starej domeny. | Średni |
| **Telefon** | Numer szkoły istniał tylko w `SCHOOL_NOTIFY_PHONE` (`+48666661750`), niewidoczny publicznie. | Średni |
| **OG/Twitter per-page** | Tylko globalny OG w layoutcie; podstrony bez własnych OG. | Niski |
| **Linkowanie wewnętrzne lokalne** | Brak linków do treści lokalnej (bo jej nie było). | Średni |

## Elementy, które już były poprawne

- Poprawny `metadataBase`, tytuł z szablonem `%s | uNick Academy`.
- `html lang` ustawiany dynamicznie (`SetHtmlLang`) + statyczny `lang="pl"` w root layout.
- Skip-link do treści, `main#main-content`, semantyczne nagłówki na podstronach.
- Obrazy przez `next/image` w wielu miejscach; `PlaceholderMedia` z `loading="lazy"` i `aria-label`.
- Redirecty polskich aliasów prawnych (`/kontakt`, `/polityka-prywatnosci`, `/regulamin`).
- GA4 warunkowany zgodą (prywatność OK).

## Wydajność / Core Web Vitals

Nie uruchamiano Lighthouse w tym środowisku (brak przeglądarki headless w pipeline
audytu). Ocena na podstawie kodu: rozsądny rozmiar JS marketingu (~147–151 kB First
Load), lazy-loading obrazów, fonty `display: swap`. Rekomendowany osobny pomiar
Lighthouse po wdrożeniu na produkcję — patrz `SEO_MEASUREMENT_PLAN.md`.

## Build / lint (stan początkowy)

- `npm run build` — przechodzi (0 błędów TS).
- `npm run lint` — 48 zgłoszeń (32 błędy, 16 ostrzeżeń) w komponentach interaktywnych
  (`CookieBanner`, `ConsultationModal`, `GoogleAnalytics` itd.), reguła
  `react-hooks/set-state-in-effect`. Są to problemy zastane, niezwiązane z SEO; build
  celowo ignoruje ESLint (`next.config.ts`). Nasze zmiany nie dodają nowych zgłoszeń.
