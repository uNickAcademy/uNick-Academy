# Formularz dostępności — wrzesień 2026 (strona tymczasowa)

Jednorazowy nabór: zbieramy od rodziców dostępność i preferencje, żeby ułożyć
grafik na rok szkolny 2026/2027 pod prawdziwe terminy rodzin.

- **Adres:** `/pl/dostepnosc` (tylko po polsku; `/en/dostepnosc` przekierowuje na PL)
- **Krótki adres:** `unick-academy.pl/september` → przekierowuje na `/pl/dostepnosc` (do podyktowania, druku)
- **Otwarty do:** 7.09.2026, 23:59 czasu polskiego
- **Dla kogo:** formularz pyta na wstępie „Dla mnie” czy „Dla dziecka” —
  przy „Dla mnie” nie pyta o osobne imię (to ta sama osoba co w danych
  kontaktowych) ani o wiek (nieistotny przy planowaniu zajęć dla dorosłych,
  kolumna `child_age` jest na to nullable)
- **Zapis:** tabela `availability_declarations` w Supabase (główne źródło prawdy,
  widoczne w `/admin/dostepnosc`), plus webhook Zapiera → Google Sheets i kopia
  mailem na `SCHOOL_NOTIFY_EMAIL` — dwa dodatkowe, niezależne kanały
- **Po wysłaniu:** zgłaszająca się osoba dostaje od razu prawdziwe konto (status
  `trial`, częściowe dane już wpisane) i mail z podziękowaniem + przyznanym
  kodem polecenia (50 zł zniżki dla obu stron) + linkiem do ustawienia hasła —
  patrz sekcja 2 niżej

Strona jest `noindex` i celowo nie ma jej w `src/app/sitemap.ts` — po usunięciu
nie zostanie po niej martwy link w wynikach wyszukiwania.

---

## 1. Zgłoszenia w panelu admina — `/admin/dostepnosc`

Każde zgłoszenie zapisuje się w Supabase (tabela `availability_declarations`,
migracja `supabase/migrations/20260828130737_availability_declarations.sql`)
i od razu widać je w panelu, w zakładce **Dostępność — wrzesień** (widoczna
dla admina i recepcji, tak jak „Prośby o zapis”). To jest teraz **główny
zapis** — webhook Zapiera i mail to dodatkowe kanały, nie jedyny zapis, więc
ich ewentualna awaria już nie blokuje zgłoszenia ani nie chowa go przed
zespołem.

Z panelu można oznaczyć zgłoszenie jako „Skontaktowano się” albo
zarchiwizować, oraz wyeksportować wszystko do CSV (przycisk w nagłówku strony).

## 2. Konto zakłada się od razu, z prawdziwym kodem polecenia

Zgłoszenie od razu zakłada osobie wypełniającej formularz **prawdziwe konto**
(status ucznia `trial`, dane rodzica/dziecka już wpisane) — dokładnie tym
samym mechanizmem, którego używa reszta publicznych zapisów w tym systemie
(`_booking_ensure_account` + `_booking_ensure_student`, przez nową funkcję
`public_availability_declaration()`; ten sam wzorzec co ścieżka
„doradztwo/zajęcia indywidualne” w `src/app/api/booking/route.ts`, gdzie
komentarz w kodzie mówi wprost: „konto powstaje od razu, żeby klient nie
musiał zakładać go osobno”).

Dzięki temu przyznany kod polecenia to **prawdziwy `students.referral_code`**
tego konta, nie osobno generowany, zarezerwowany napis — działa w
`register_referral` **natychmiast**, bez żadnego ręcznego przepisywania. Kto
zapisze się z tym kodem i opłaci pierwsze zajęcia, obie strony dostają po
50 zł zniżki, w pełni automatycznie.

Formularz ma też osobne pole „Kod polecenia” na dole (`referral_code` w
tabeli) — to kod, który TA rodzina podała, bo ktoś polecił im nas. Jeśli go
poda, `register_referral()` rejestruje tę relację od razu (świadczenie
naliczy się dopiero po realnej wpłacie — ale nie trzeba już czekać na zapis
ani ręcznie nic dopisywać).

Mail podziękowania zawiera też **jednorazowy link do ustawienia hasła**
(`createPasswordSetupLink`, ten sam co przy innych zapisach — przekierowuje na
`/reset-haslo`). Rodzina nie musi go użyć od razu: konto i tak już istnieje z
częściowymi danymi, więc gdy się zdecyduje, wystarczy ustawić hasło — bez
wypełniania niczego od nowa.

## 3. Podłączenie arkusza (Zapier)

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

## 4. Co gdzie leży

| Plik | Rola |
| ---- | ---- |
| `src/app/[locale]/dostepnosc/page.js` + `AvailabilityPage.module.css` | strona (hero, formularz, komunikat po zamknięciu) |
| `src/app/components/availability/AvailabilityForm.tsx` + `.module.css` | formularz, logika warunkowa, przedziały godzinowe, pole kodu polecenia |
| `src/app/components/availability/TimeRangeSlider.tsx` + `.module.css` | suwak zakresu z dwoma uchwytami |
| `src/app/components/availability/AvailabilityBanner.js` + `.module.css` | pasek na stronie głównej |
| `src/app/components/availability/AvailabilityPopup.tsx` + `.module.css` | popup na stronie głównej |
| `src/app/api/availability/route.ts` | walidacja, wywołanie RPC (konto + zapis), link do ustawienia hasła, wysyłka do Zapiera, mail podziękowania i mail wewnętrzny |
| `src/lib/availability/*` | stałe, listy wyboru, walidacja, data zamknięcia |
| `public/availability/banner.jpg` | baner na górze strony |
| `supabase/migrations/20260828130737_availability_declarations.sql` | tabela zgłoszeń + RLS |
| `supabase/migrations/20260828173000_availability_declaration_account.sql` | kolumna `student_id` + funkcja `public_availability_declaration()` (konto, uczeń, zapis, kod polecenia, referral) |
| `supabase/migrations/20260901120000_availability_child_age_optional.sql` | `child_age` bez `NOT NULL` — „dla mnie” nie pyta o wiek |
| `src/app/(admin)/admin/dostepnosc/page.tsx` + `AvailabilityInboxView.tsx` | panel admina — lista zgłoszeń |
| `src/app/api/admin/availability/route.ts` | zmiana statusu zgłoszenia + eksport CSV |
| `availabilityThankYouEmail` w `src/lib/email/templates.ts` + `sendAvailabilityThankYou` w `send.ts` | mail podziękowania z kodem polecenia |

Poza tym kilka miejsc ma wklejone fragmenty, nie całe pliki — patrz krok 6 niżej:
`src/app/[locale]/page.js` (banner + popup), `src/app/components/Navbar.js` +
`.module.css` (przycisk „Zapisy na wrzesień” w rogu każdej podstrony) oraz
`src/app/(admin)/admin/AdminSidebar.tsx` (pozycja menu „Dostępność — wrzesień”).

## 5. Po terminie — nic nie trzeba robić

Po 7.09.2026 strona sama pokazuje komunikat „formularz zamknięty” z kontaktem,
pasek na stronie głównej znika, a endpoint odrzuca spóźnione zgłoszenia (410).
Obie strony odświeżają się co godzinę (`revalidate = 3600`), więc zmiana
zaskakuje najpóźniej godzinę po terminie — bez deployu.

Datę zmienia się w jednym miejscu: `FORM_CLOSES_AT` w
`src/lib/availability/window.ts` (i `FORM_CLOSES_LABEL` obok, bo pojawia się
w treści).

## 6. Trwałe usunięcie

Dane zgłoszeń (`availability_declarations`) mają wartość jako historyczny
zapis preferencji rodzin — **nie trzeba** ich kasować razem z kodem.

**Uwaga:** od kroku z automatycznym zakładaniem konta (sekcja 2) usunięcie
kodu formularza **nie** usuwa realnych kont — każde zgłoszenie zostawia
prawdziwy wiersz w `auth.users`/`profiles`/`students` (status `trial`,
`signup_source = 'formularz_dostepnosc'`). Te konta mają samodzielną wartość
(rodzina może się nimi zalogować, gdy się zdecyduje) i **nie kasuje się ich**
razem z resztą naboru — dotyczy to wyłącznie samego formularza i kodu wokół
niego (kroki 1–8 niżej). Jeśli mimo to chcesz sprzątnąć dane zgłoszeń do
końca, dorzuć krok 9; kont uczniów krok 9 celowo nie rusza.

1. Skasuj katalogi `src/app/[locale]/dostepnosc/`,
   `src/app/components/availability/`, `src/app/api/availability/`,
   `src/app/(admin)/admin/dostepnosc/`, `src/app/api/admin/availability/`,
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
4. W `src/app/(admin)/admin/AdminSidebar.tsx` usuń pozycję `/admin/dostepnosc`
   z listy `NAV` (i import ikony `CalendarCheck`, jeśli nieużywana gdzie indziej).
5. W `src/lib/email/templates.ts` usuń `availabilityThankYouEmail` (i
   `escapeHtmlAvailability`, jeśli nieużywane gdzie indziej), w `send.ts` usuń
   `sendAvailabilityThankYou` i jej import.
6. Usuń `ZAPIER_AVAILABILITY_WEBHOOK_URL` z `.env.example` i z Vercela.
7. W `next.config.ts` usuń wpis `{ source: "/september", ... }` z `redirects()`.
8. Skasuj ten plik.
9. (Opcjonalnie, tylko jeśli naprawdę chcesz skasować dane zgłoszeń) nową
   migracją — nie ręcznie w konsoli Supabase, żeby historia migracji się
   zgadzała — usuń funkcję i tabelę:
   `drop function public.public_availability_declaration(text, text, text, text, text, integer, text, text[], text[], text, text, text, jsonb, text, text, text);`
   `drop table public.availability_declarations;`
   Konta (`auth.users`/`profiles`/`students`, `signup_source =
   'formularz_dostepnosc'`) zostają — to osobna decyzja, patrz uwaga wyżej.

W sitemapie nie ma nic do sprzątania — formularz nigdy tam nie był.
