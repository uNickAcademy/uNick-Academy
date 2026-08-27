# Formularz dostępności — wrzesień 2026 (strona tymczasowa)

Jednorazowy nabór: zbieramy od rodziców dostępność i preferencje, żeby ułożyć
grafik na rok szkolny 2026/2027 pod prawdziwe terminy rodzin.

- **Adres:** `/pl/dostepnosc` (tylko po polsku; `/en/dostepnosc` przekierowuje na PL)
- **Krótki adres:** `unick-academy.pl/september` → przekierowuje na `/pl/dostepnosc` (do podyktowania, druku)
- **Otwarty do:** 7.09.2026, 23:59 czasu polskiego
- **Zapis:** webhook Zapiera → nowy wiersz w Google Sheets, plus kopia mailem

Strona jest `noindex` i celowo nie ma jej w `src/app/sitemap.ts` — po usunięciu
nie zostanie po niej martwy link w wynikach wyszukiwania.

---

## 1. Podłączenie arkusza (Zapier)

1. W Zapierze: **Create Zap → Trigger: Webhooks by Zapier → Catch Hook**.
2. Skopiuj wygenerowany „Custom Webhook URL”.
3. Wklej go w Vercel → Project Settings → Environment Variables jako
   `ZAPIER_AVAILABILITY_WEBHOOK_URL` (Production + Preview) i zrób redeploy.
   URL webhooka jest tajny — kto go zna, może dopisywać wiersze do arkusza,
   dlatego trzymamy go w zmiennej środowiskowej, a nie w kodzie.
4. Wyślij testowe zgłoszenie z `/pl/dostepnosc` i w Zapierze kliknij
   **Test trigger** — pojawi się komplet pól do zmapowania.
5. **Action: Google Sheets → Create Spreadsheet Row.** Zmapuj kolumny 1:1:

| Kolumna w arkuszu | Pole z webhooka    | Przykład |
| ----------------- | ------------------ | -------- |
| data zgłoszenia   | `data_zgloszenia`  | `2026-09-01 18:42` |
| imię rodzica      | `imie_rodzica`     | `Anna` |
| nazwisko rodzica  | `nazwisko_rodzica` | `Kowalska` |
| e-mail            | `email`            | `anna@example.com` |
| telefon           | `telefon`          | `600 100 200` |
| dziecko           | `dziecko`          | `Zosia` |
| wiek              | `wiek`           | `9` |
| poziom            | `poziom`         | `Początkujący` |
| tryb              | `tryb`           | `Grupowo` (albo `Grupowo oraz Indywidualnie` — pole wielokrotnego wyboru) |
| forma zajęć       | `forma`          | `W szkole dziecka` (albo kilka form połączonych „oraz” — też wielokrotny wybór) |
| adres             | `adres`          | (pusty, gdy nie dotyczy) |
| szkoła            | `szkola`         | `SP nr 1` |
| miejscowość       | `miejscowosc`    | `Tarnowo Podgórne` |
| dostępność        | `dostepnosc`     | `Poniedziałek: 8:00 do 10:00 oraz 16:00 do 18:00; Środa: 16:00 do 18:00` |
| uwagi             | `uwagi`          | `Rodzeństwo w jednej grupie` |

Dostępność jest **spłaszczona do jednego zdania** już po stronie aplikacji, więc
wchodzi w jedną komórkę — Zapier nie musi rozwijać zagnieżdżonej struktury.

### Zanim webhook zostanie wklejony

Formularz działa i bez niego: każde zgłoszenie leci mailem na
`SCHOOL_NOTIFY_EMAIL`. Kopia mailowa idzie **zawsze**, także przy działającym
Zapierze — to drugi, niezależny odbiornik. Jeśli akurat nie udało się dopisać
wiersza w arkuszu, mail ma o tym adnotację („przepisz ręcznie”). Dopiero gdy
zabraknie i webhooka, i `RESEND_API_KEY`, rodzic zobaczy błąd zamiast
podziękowania — nie chcemy dziękować za coś, czego nie zapisaliśmy.

---

## 2. Co gdzie leży

| Plik | Rola |
| ---- | ---- |
| `src/app/[locale]/dostepnosc/page.js` + `AvailabilityPage.module.css` | strona (hero, formularz, komunikat po zamknięciu) |
| `src/app/components/availability/AvailabilityForm.tsx` + `.module.css` | formularz, logika warunkowa, przedziały godzinowe |
| `src/app/components/availability/TimeRangeSlider.tsx` + `.module.css` | suwak zakresu z dwoma uchwytami |
| `src/app/components/availability/AvailabilityBanner.js` + `.module.css` | pasek na stronie głównej |
| `src/app/components/availability/AvailabilityPopup.tsx` + `.module.css` | popup na stronie głównej |
| `src/app/api/availability/route.ts` | walidacja, wysyłka do Zapiera, kopia mailem |
| `src/lib/availability/*` | stałe, listy wyboru, walidacja, data zamknięcia |
| `public/availability/banner.jpg` | baner na górze strony |

Poza tym dwa miejsca mają wklejone fragmenty, nie całe pliki — patrz krok 2 niżej:
`src/app/[locale]/page.js` (banner + popup) i `src/app/components/Navbar.js` +
`.module.css` (przycisk „Zapisy na wrzesień” w rogu każdej podstrony).

## 3. Po terminie — nic nie trzeba robić

Po 7.09.2026 strona sama pokazuje komunikat „formularz zamknięty” z kontaktem,
pasek na stronie głównej znika, a endpoint odrzuca spóźnione zgłoszenia (410).
Obie strony odświeżają się co godzinę (`revalidate = 3600`), więc zmiana
zaskakuje najpóźniej godzinę po terminie — bez deployu.

Datę zmienia się w jednym miejscu: `FORM_CLOSES_AT` w
`src/lib/availability/window.ts` (i `FORM_CLOSES_LABEL` obok, bo pojawia się
w treści).

## 4. Trwałe usunięcie

1. Skasuj katalogi `src/app/[locale]/dostepnosc/`,
   `src/app/components/availability/`, `src/app/api/availability/`,
   `src/lib/availability/` i `public/availability/`.
2. W `src/app/[locale]/page.js` usuń importy `AvailabilityBanner` i
   `AvailabilityPopup`, obie linijki `<Availability… locale={locale} />` oraz
   `export const revalidate` (był tylko po to, żeby pasek/popup zniknęły same).
3. W `src/app/components/Navbar.js` usuń import `isFormOpen`, linijkę
   `showAvailabilityCta` oraz OBA bloki `{showAvailabilityCta && (...)}` z
   przyciskiem — jeden w górnym pasku, drugi w `.mobileExtra` (rezerwa na
   ekranach <390px, gdzie przycisk w pasku sam się chowa). W
   `Navbar.module.css` usuń `.septemberCta`, `.septemberCtaFull`,
   `.septemberCtaShort` i ich media queries.
4. Usuń `ZAPIER_AVAILABILITY_WEBHOOK_URL` z `.env.example` i z Vercela.
5. W `next.config.ts` usuń wpis `{ source: "/september", ... }` z `redirects()`.
6. Skasuj ten plik.

W sitemapie nie ma nic do sprzątania — formularz nigdy tam nie był.
