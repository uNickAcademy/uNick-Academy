# uNick Academy — Raport wdrożenia SEO / Local SEO / GEO

Data: 2026-07-22 · Gałąź: `claude/session-008uwe`

## 1. Wykryty stack

Next.js 15.5 (App Router) + React 19, marketing w JS pod `src/app/[locale]/`,
tłumaczenia w `src/app/lib/dictionaries/{pl,en}.js`, hosting Vercel (deploy z
`main`), GA4 za zgodą. Szczegóły: `SEO_BASELINE_AUDIT.md`.

## 2. Lista zmienionych / nowych plików

**Nowe pliki (kod):**
- `src/app/robots.ts` — polityka botów (search + AI) + sitemap.
- `src/app/sitemap.ts` — kanoniczne URL-e obu języków + hreflang.
- `src/app/lib/seo.js` — helper `buildMetadata` (canonical/hreflang/OG/Twitter).
- `src/app/lib/structured-data.js` — generatory JSON-LD (`@graph`).
- `src/app/components/JsonLd.js` — render JSON-LD (SSR).
- `src/app/components/AddressBlock.js` — NAP jako semantyczny `<address>`.
- `src/app/components/LocationSection.js` — sekcja lokalna + mapa + trasa.
- `src/app/components/LocalLanding.js` — szablon lokalnej strony docelowej.
- `src/app/[locale]/szkola-jezykowa-tarnowo-podgorne/page.js` — lokalna strona PL.
- `src/app/[locale]/english-school-tarnowo-podgorne/page.js` — lokalna strona EN.
- `public/llms.txt` — indeks treści dla wyszukiwarek AI.

**Zmienione pliki:**
- `next.config.ts` — mapa przekierowań (stare slugi + ujednolicenie slugów lokalnych).
- `src/app/[locale]/layout.js` — canonical/hreflang (+x-default) strony głównej, OG obraz, wstrzyknięcie globalnego JSON-LD.
- `src/app/[locale]/page.js` — sekcja lokalna na stronie głównej.
- `src/app/[locale]/contact/page.js` — NAP w HTML, mapa, przyciski, JSON-LD (WebPage/Breadcrumb/FAQ); usunięty placeholder mapy.
- Wszystkie pozostałe podstrony `[locale]/*` — `buildMetadata` (canonical+hreflang+OG).
- `src/app/components/Footer.js` — blok NAP w stopce.
- `src/app/lib/site-config.js` — adres, telefon, geo/areaServed, helpery map, link lokalny w stopce.
- `src/app/lib/dictionaries/{pl,en}.js` — meta titles/descriptions (lokalne + native speaker), sekcje `nap`/`location`, słownik strony lokalnej, hero z sygnałem lokalnym.

**Dokumentacja:** `docs/SEO_BASELINE_AUDIT.md`, `docs/SEO_IMPLEMENTATION_REPORT.md`,
`docs/SEO_CONTENT_NEEDED.md`, `docs/HOSTING_AND_DOMAIN_REDIRECTS.md`,
`docs/GOOGLE_BUSINESS_PROFILE_PLAN.md`, `docs/LOCAL_SEO_OFFSITE_PLAN.md`,
`docs/SEO_MEASUREMENT_PLAN.md`, `docs/CONTENT_BRIEFS_LOCAL_SEO.md`, `docs/redirect-map.csv`.

## 3. Najważniejsze błędy przed zmianami

Brak robots.txt i sitemap.xml; brak canonical/hreflang per-page (ryzyko kanonizacji
wszystkiego do `/`); zero danych strukturalnych; brak sygnałów lokalnych i NAP w
treści; widoczny placeholder mapy na kontakcie; brak lokalnej strony docelowej;
ogólne metadane bez fraz lokalnych.

## 4. Wdrożone poprawki

- **robots.txt** (dynamiczny): `Googlebot`, `Bingbot`, `OAI-SearchBot`,
  `Claude-SearchBot`, `Claude-User` — Allow; `GPTBot`, `ClaudeBot`, `CCBot`,
  `Google-Extended` — Disallow (bez zgody na trening). Blokada ścieżek prywatnych.
  Wskazanie `Sitemap:` i `host`.
- **sitemap.xml** (dynamiczny): tylko kanoniczne HTTPS obu języków, z wzajemnymi
  `alternates` (pl/en/x-default), realistyczne `lastmod`/`priority`, w tym para
  lokalnych stron o różnych slugach.
- **Metadane per-page**: `buildMetadata` ustawia self-canonical, hreflang
  (pl/en/x-default), OG i Twitter na każdej podstronie; strona główna analogicznie
  w layoutcie.
- **Meta titles/descriptions**: przepisane pod frazy lokalne (Rumianek / Tarnowo
  Podgórne / Poznań) i z naciskiem na native speakerów, PL i EN.
- **Dane strukturalne (JSON-LD, jeden `@graph`, spójne `@id`):**
  globalnie `EducationalOrganization`+`LocalBusiness`, `WebSite`, `Place` (adres,
  areaServed, sameAs, contactPoint, availableLanguage); per-page `WebPage`,
  `BreadcrumbList`, `FAQPage` (kontakt, strona lokalna), `Course` (strona lokalna).
  Bez zgadywania geo i godzin (patrz braki).
- **Strona główna**: hero z konkretnym opisem lokalnym; sekcja „Zajęcia stacjonarne
  w Rumianku” (adres, gmina, mapa, przyciski Zadzwoń/Napisz/Trasa, link do strony
  lokalnej, info o dojeździe z okolic).
- **Kontakt**: prawdziwy NAP jako tekst HTML (`<address>`), telefon +48 666 661 750,
  e-mail, przyciski Zadzwoń/Napisz/Wyznacz trasę, osadzona mapa; **usunięty
  placeholder** „Lokalizacja — mapa / placeholder studia”.
- **Stopka**: blok NAP na każdej stronie + link do strony lokalnej.
- **Przekierowania**: stare slugi WP → nowe strony (301), ujednolicenie slugów
  lokalnych per język (301); domenowe (www/HTTPS/stara domena) opisane w dokumentacji.
- **llms.txt**: indeks kluczowych stron PL/EN dla wyszukiwarek AI.

## 5. Nowe strony

- `/pl/szkola-jezykowa-tarnowo-podgorne` — lokalna strona docelowa (dla kogo,
  oferta dla dzieci/młodzieży/dorosłych, indywidualne, małe grupy, native speakerzy,
  metoda, lokalizacja+mapa+dojazd, FAQ 10 pytań, CTA, linki do oferty).
- `/en/english-school-tarnowo-podgorne` — odpowiednik EN (pełna treść, nie samo tłumaczenie SEO).

## 6. Nowe przekierowania

Patrz `docs/redirect-map.csv`. W repozytorium (next.config): 12 reguł ścieżkowych
(stare slugi + 2 ujednolicające slugi lokalne). Domenowe do wdrożenia na hostingu.

## 7. Status sitemap

✅ Wygenerowana pod `/sitemap.xml`, tylko kanoniczne HTTPS, oba języki + hreflang,
brak starej domeny / stron technicznych. Wskazana w robots.txt.

## 8. Status robots.txt

✅ Wygenerowany pod `/robots.txt`. Dozwolone boty search i AI-search; zablokowane
boty trenujące i ścieżki prywatne. Zawiera `Sitemap:`.

## 9. Status danych strukturalnych

✅ Globalny graf organizacji/lokalizacji/WebSite na każdej stronie marketingowej;
per-page WebPage+Breadcrumb; FAQ na kontakcie i stronie lokalnej; Course na stronie
lokalnej. Bez `aggregateRating`/`Review` firmy (zgodnie z wytycznymi). Braki: geo,
godziny (nie zgadujemy — patrz `SEO_CONTENT_NEEDED.md`).

## 10. Status hreflang

✅ Wzajemne pl/en + x-default (→pl) na wszystkich stronach, w tym para lokalnych
stron o różnych slugach. Canonical zawsze self-referencing dla danego języka.

## 11. Wyniki build / lint / typecheck / testy

- `npm run build` — ✅ przechodzi (0 błędów TS; typecheck włączony w buildzie).
- `npm run lint` — 48 zgłoszeń (32 błędy, 16 ostrzeżeń) **identycznie jak przed
  zmianami** — wyłącznie zastane problemy `react-hooks` w komponentach
  interaktywnych, nie w plikach SEO. Build ignoruje ESLint z konfiguracji.
- Testy jednostkowe — brak zdefiniowanego skryptu `test` w projekcie.

## 12. Działania wymagające dostępu zewnętrznego

- Przekierowania domenowe (www→bez-www, HTTP→HTTPS, `unickacademy.pl`→`unick-academy.pl`)
  — Vercel/DNS (`HOSTING_AND_DOMAIN_REDIRECTS.md`).
- Google Business Profile (`GOOGLE_BUSINESS_PROFILE_PLAN.md`).
- Google Search Console: dodać właściwość i przesłać sitemap.
- GA4: zdefiniować zdarzenia-konwersje i segment ruchu AI (`SEO_MEASUREMENT_PLAN.md`).
- Spójność NAP w serwisach zewnętrznych (`LOCAL_SEO_OFFSITE_PLAN.md`).

## 13. Brakujące dane

NIP, godziny otwarcia, współrzędne geo, Place ID, parking, ceny, harmonogram,
zdjęcia sali/wejścia, migracja zdjęć nauczycieli ze starej domeny — pełna lista w
`SEO_CONTENT_NEEDED.md`.

## 14. Ryzyka

- Zdjęcia nauczycieli linkowane ze starej domeny przestaną działać po jej wygaszeniu
  — przenieść przed migracją.
- Osadzona mapa Google używa publicznego `output=embed` (bez klucza) i pokazuje
  obszar wyszukiwania; precyzyjny pin wymaga potwierdzonych współrzędnych / Place ID.
- Zastane błędy lint `react-hooks` — do sprzątnięcia osobno (poza zakresem SEO).

## 15. Rekomendowane kolejne kroki

1. Wdrożyć przekierowania domenowe i skonfigurować GBP + GSC.
2. Uzupełnić braki z `SEO_CONTENT_NEEDED.md` (geo, godziny, ceny, zdjęcia).
3. Dodać architekturę bloga i publikować artykuły z `CONTENT_BRIEFS_LOCAL_SEO.md`.
4. Skonfigurować konwersje GA4 i comiesięczny przegląd (`SEO_MEASUREMENT_PLAN.md`).
5. Uruchomić Lighthouse na produkcji i domknąć Core Web Vitals.

## 16. Instrukcja wdrożenia na produkcję

1. `npm run build` lokalnie (musi przejść — ✅).
2. Merge/fast-forward gałęzi na `main` → Vercel deployuje automatycznie.
3. W Vercel: ustawić domenę główną bez `www`, redirect z `www`, dodać i przekierować
   `unickacademy.pl` (patrz dokument hostingowy).
4. W GSC przesłać `https://unick-academy.pl/sitemap.xml`.

## 17. Instrukcja kontroli po wdrożeniu

- `curl -I https://unick-academy.pl/robots.txt` → 200, zawiera `Sitemap:`.
- `curl https://unick-academy.pl/sitemap.xml` → tylko `https://unick-academy.pl/...`.
- Otwórz `/pl` i `/pl/szkola-jezykowa-tarnowo-podgorne` → sprawdź tytuł, H1, NAP,
  mapę, canonical i JSON-LD (Rich Results Test).
- Sprawdź hreflang w źródle strony (pl/en/x-default).
- Test 25 zapytań z `SEO_MEASUREMENT_PLAN.md` (Google + ChatGPT + Claude).
- Zweryfikuj, że stare slugi zwracają 301 na nowe strony.
