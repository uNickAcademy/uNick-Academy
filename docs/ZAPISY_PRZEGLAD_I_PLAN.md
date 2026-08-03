# Zapisy — przegląd stanu faktycznego i plan prac

Data: 2026-08-03 · Gałąź: `claude/signup-process-optimization-b8ta9c`
Status: **przegląd zakończony, czekam na potwierdzenie planu. Nic nie zostało zmienione.**

Źródła: kod w repo (stan `main`) + produkcyjna baza Supabase `xkydfgunafxfuzsggmca` (odczyt).

---

## 0. Odpowiedzi na pytania z sekcji KONTEKST

### 0.1. Migracje 116 / 117 — NIE MA ICH W TYM REPO

| | |
|---|---|
| Migracje w repo | kończą się na `115_online_booking_pending_approval.sql` |
| `116_*` / `117_*` | **nie istnieją** — ani na `main`, ani w żadnej gałęzi widocznej w tym klonie, ani w historii gita |
| Tabele `leads`, `lead_events`, `conversations` | **istnieją na produkcji** i mają pełną strukturę |
| Odwołania do nich w kodzie | **zero** — `grep` po `from('leads')` i `lead_events` w całym `src/` nie zwraca nic |

Czyli: lejek Łowcy/Odzyskiwacza żyje **wyłącznie w bazie**. Kod w tej gałęzi o nim nie wie.

**To jest blokada dla Bloku 4.** Jeśli zacznę tu pisać zapisy do `leads`, powstanie druga,
niezależna implementacja tego samego — dokładnie to, czego chciałaś uniknąć. Potrzebuję albo
gałęzi z migracjami 116/117 dociągniętej do tego repo, albo Twojej zgody, żeby Blok 4 zrobić
jako *cienki adapter* (jedna funkcja `createLead()`, którą tamta gałąź podmieni na swoją).

### 0.2. Kształt `leads` (stan produkcyjny)

Enumy:

| Enum | Wartości |
|---|---|
| `lead_source` | `form` · `whatsapp` · `messenger` · `instagram` · `phone` · `referral` · `reactivation` · `walk_in` |
| `lead_status` | `new` · `contacted` · `qualified` · `booked` · `no_show` · `won` · `lost` · `nurture` |
| `lead_student_type` | `child` · `teen` · `adult` · `corporate` |

Kolumny istotne dla briefu: `campaign` (text), `first_name`, `last_name`, `phone`, `email`,
`student_type`, `student_age`, `parent_name`, `goal`, `previous_attempts`, `preferred_start`,
`status`, `max_stage`, `owner_id`, `consent_marketing`, `consent_at`, `consent_clause`,
`next_followup_at`, `followups_sent`.

**Czego brakuje pod ten brief:** pola na **lokalizację** (Rumianek / online — Krok 2) i pola
wiążącego leada z **konkretną wybraną grupą** (Krok 4). Oba trzeba dodać.

### 0.3. Jeden projekt Next.js, dwa równoległe światy w środku

To **jeden** projekt (`package.json`, jeden `next.config.ts`, jeden `middleware.ts`). Ale w środku
są dwa niezależne zestawy:

| | Marketing | Aplikacja |
|---|---|---|
| Ścieżka | `src/app/[locale]/*` | `src/app/(public)`, `(admin)`, `(student)`, `(auth)`… |
| Język | JavaScript (`.js`) | TypeScript (`.tsx`) |
| Tłumaczenia | `src/app/lib/dictionaries/{pl,en}.js` (własne, **bez next-intl** — nie ma go w zależnościach) | brak, teksty w kodzie po polsku |
| Komponenty | `src/app/components/*` (własny Navbar, Footer) | `src/components/public/*` (drugi Navbar, Footer) |

Konsekwencja dla Kroku 3: `ConsultationProvider` jest komponentem **JS z warstwy marketingowej**,
a `BookingWizard` to **TSX z warstwy aplikacji**. Współdzielenie jest wykonalne, ale wymaga
wyciągnięcia wspólnej części do neutralnego modułu — szczegóły w §3.

---

## 1. BLOK 1 — naprawa danych: co potwierdzam, a co wygląda inaczej

### 1.1. Dostępność nauczycieli — POTWIERDZONE, Twoja lista jest dokładna

Siedmiu nauczycieli ma zero aktywnych wpisów w `availability`. Lista zgadza się co do osoby:

| Nauczyciel | Sloty dostępności | Przyszłe lekcje w kalendarzu |
|---|---:|---:|
| Tim | 30 | **0** |
| Nick | 10 | 81 |
| Gio | 7 | 0 |
| Toni | 6 | 0 |
| Yan | 6 | 113 |
| Shakina | 2 | 0 |
| **Adriana** | **0** | 0 |
| **Bertie** | **0** | 0 |
| **Elliott** | **0** | **56** |
| **Jack** | **0** | **128** |
| **Mada** | **0** | **21** |
| **Michelle** | **0** | 0 |
| **Stefania** | **0** | 0 |

**Ważna korekta do interpretacji:** pusta dostępność ≠ osoba nieaktywna. **Jack ma 128 przyszłych
lekcji — najwięcej w całej szkole — i zero opublikowanej dostępności.** Elliott 56, Mada 21.
Odwrotnie: Tim opublikował 30 slotów i nie uczy ani jednej lekcji.

Czyli `availability` nie opisuje tego, kto pracuje, tylko tego, kto wypełnił grafik. Oznaczenie
tych siedmiu jako „niedostępni do rezerwacji online" jest poprawne **jako doraźna zaślepka**, ale
zapisanie tego jako `is_active = false` byłoby błędem — wyłączyłoby z systemu trzy osoby, które
realnie uczą. Proponuję osobną flagę `is_bookable_online`, nietykającą `is_active`.

### 1.2. Poziomy nauczycieli — POTWIERDZONE, puste u wszystkich 13

`teachers.levels` = `{}` u każdego z trzynastu. Typ kolumny: `_language_level` (tablica enuma).
Zgodnie z Twoim poleceniem **nie zgaduję** — przygotuję listę do ręcznego uzupełnienia (§5).

### 1.3. Język nauczyciela — TWOJA OBSERWACJA SŁUSZNA, ale problem jest głębszy

**W bazie nie ma żadnego pola na język.** Ani `teachers`, ani `groups` nie mają kolumny
`language` / `languages`. Sprawdziłem pełną listę kolumn obu tabel.

Więc nie da się „dodać filtra po języku" — nie ma po czym filtrować. Trzeba najpierw dodać kolumnę
w obu tabelach, uzupełnić dane (to znowu wiedza, której nie zgaduję — Adriana i Stefania to
Twoja informacja, reszty nie znam) i dopiero potem filtrować. Do zdecydowania przez Ciebie:
czy nauczyciel może mieć kilka języków (tablica) czy jeden (pojedyncza wartość).

### 1.4. Liczniki miejsc — POTWIERDZONE, ale przyczyna jest INNA niż zakładałaś

To **nie jest** hardkodowana wartość domyślna. Kod liczy `taken` poprawnie
(`queries.ts:783` — `taken = members.length`, `spots = capacity - taken`).

Prawdziwa przyczyna to **Row Level Security**. Polityka na `group_members` brzmi
*„Członkostwa widoczne dla zalogowanych"*. Strona `/zapisy` czyta bazę klientem anonimowym, więc
zagnieżdżone `members:group_members(student_id)` wraca jako **pusta tablica** — Supabase nie zgłasza
błędu, po prostu nic nie zwraca. Stąd `taken: 0, spots: 8` dla każdej grupy bez wyjątku.

Realne dane (odczyt z uprawnieniami serwisowymi): Big Action Games 1, Little Explorers 1,
Teenpreneurs 1, pozostałe 10 grup 0. Czyli **3 zapisane osoby na 104 miejsca**.

Dwie konsekwencje, obie gorsze niż sam licznik:

1. Badge „Lista rezerwowa" jest publicznie **nieosiągalny** — `spots` zawsze wynosi 8, więc nawet
   pełna grupa pokaże „Wolne miejsca".
2. Funkcja zapisu `public_enroll_group` działa jako `SECURITY DEFINER`, czyli **widzi prawdziwe
   liczby** i rzuca wyjątkiem „Brak wolnych miejsc w grupie". Klient przejdzie więc cały kreator,
   wypełni dane, zaakceptuje regulamin — i dostanie błąd dopiero po kliknięciu „Potwierdź".

To jest najpoważniejszy błąd z całego Bloku 1 i zgadzam się, że musi wejść przed przebudową ekranów.
Naprawa: publiczna funkcja lub widok zwracający wyłącznie *liczbę* członków (bez danych osobowych),
zamiast rozluźniania RLS na `group_members`.

### 1.5. Duplikat grupy — TO NIE JEST DUPLIKAT

Dwie grupy, utworzone dwa dni po sobie, ale **różniące się poziomem**:

| Nazwa | Forma | Cena | `level` | `levels` | Opis |
|---|---|---:|---|---|---|
| Wiecznie Początkujący Dorosły | offline | 250 zł | A2 | `{A2, B1}` | jest |
| Wiecznie-Początkujący-Dorosły | online | 199 zł | A1 | `{A1, A2}` | **brak** |

Obie startują 2026-09-01 i kończą 2027-06-30. To są dwie **różne oferty dla różnych poziomów**,
które przez niemal identyczną nazwę wyglądają na pomyłkę.

Rekomendacja (zamiast usuwania): nazwać je tak, żeby różnica była widoczna — np.
„Wiecznie Początkujący Dorosły · online (A1–A2)" i „· stacjonarnie (A2–B1)" — oraz dopisać opis
do wersji online. Ale to Twoja decyzja biznesowa, nie moja; **nie ruszam bez potwierdzenia.**

---

## 2. BLOK 2 — niespójność prawna: pełna lista miejsc

Potwierdzam: w obiegu są dwa różne podmioty.

**Podmiot A — spółka.** UNICK ACADEMY INTERNATIONAL SP. Z O.O., ul. Nowa 23, 62-080 Rumianek,
KRS 0001093339, NIP 7812067015, REGON 528044862.

**Podmiot B — działalność osoby fizycznej.** Milena Rudd prowadząca działalność jako uNick Academy,
NIP 7812067015.

### Wszystkie miejsca do rozstrzygnięcia

| # | Miejsce | Gdzie fizycznie | Podmiot |
|---|---|---|---|
| 1 | Regulamin akceptowany w kreatorze `/zapisy` | **baza**, `terms_documents` wersja 2 (`is_current`) | **A** (spółka) |
| 2 | Polityka prywatności — administrator danych | `dictionaries/pl.js:890` | **B** |
| 3 | Polityka prywatności EN | `dictionaries/en.js:890` | **B** |
| 4 | Regulamin marketingowy — postanowienia ogólne | `dictionaries/pl.js` → `legal.termsOfService.generalText` | **B** |
| 5 | Regulamin marketingowy EN | `dictionaries/en.js`, ta sama ścieżka | **B** |
| 6 | Dane strukturalne JSON-LD (`taxID`, `vatID`) | `src/app/lib/structured-data.js:38-39` | sam NIP, bez nazwy podmiotu — **niejednoznaczne** |
| 7 | Encje księgowe UFOS | `supabase/migrations/001_ufos_schema_and_entities.sql:23-29` | **A** (dwie spółki) |

**Znalezisko dodatkowe:** w kodzie **nie ma publicznej strony `/regulamin`**. Istnieje tylko edytor
w panelu (`/admin/regulamin`). Klient w kreatorze widzi treść wklejoną z bazy do rozwijanej
harmonijki, bez linku do samodzielnego dokumentu. Brief w Kroku 5 zakłada „link do pełnego
dokumentu" — tej strony trzeba będzie po prostu nie ma i trzeba ją stworzyć.

**Nie ruszam nic z tej tabeli.** Czekam na Twoją decyzję, który podmiot obowiązuje. Uwaga na
kolejność: pozycja 1 siedzi w bazie, nie w kodzie, więc zmiana regulaminu to nowa wersja
w `terms_documents` — a `consent_acceptances` przechowuje `terms_version`, więc historyczne zgody
zostaną powiązane ze starą wersją. To jest poprawne i tak ma zostać.

---

## 3. BLOK 3 — przebudowa `/zapisy`: uwagi do projektu

Projekt pięciu kroków przyjmuję. Cztery rzeczy wymagają Twojej decyzji lub korekty.

### 3.1. Współdzielenie z `ConsultationProvider` — realne, ale nie przez wspólny komponent

`ConsultationModal.js` to JS z warstwy marketingowej, ze swoim CSS-modułem i słownikiem;
`BookingWizard.tsx` to TSX z warstwy aplikacji, z Tailwindem i tekstami w kodzie. Wspólny komponent
UI oznaczałby przepięcie jednego z nich na obcy system stylów.

Proponuję współdzielić **logikę i kontrakt danych**, nie widok: jeden moduł z definicją opcji
audience (w tym `unsure`) i jedna funkcja wysyłająca zgłoszenie. Dwa widoki, jedno źródło prawdy
i jeden endpoint. Efekt, o który Ci chodzi (brak dwóch implementacji tego samego pytania), zostaje
osiągnięty, a nie mieszamy dwóch światów stylów.

### 3.2. Nazewnictwo `source` — Twoja propozycja zderza się z istniejącą konwencją

Enum `lead_source` opisuje **kanał kontaktu** (`whatsapp`, `phone`, `walk_in`), a nie **formularz**.
Wartości `consultation_modal`, `zapisy_wizard`, `contact_form`, `group_list_button` wprowadziłyby
do jednego enuma drugą taksonomię — po kilku miesiącach nie da się odpowiedzieć na pytanie
„ile leadów przyszło z WhatsAppa", bo część formularzowych będzie miała własne wartości.

**Prościej i bez konfliktu z tamtą gałęzią:** zostawić `source = 'form'` dla wszystkich czterech
wejść, a wejście zapisywać w **istniejącej kolumnie `campaign`** (`zapisy_wizard`,
`consultation_modal`, `contact_form`, `group_list_button`, `advice`). Zero zmian w enumie, zero
ryzyka konfliktu migracji z gałęzią Łowcy, a Sara i tak filtruje po jednej kolumnie.

Jeśli wolisz mimo wszystko rozszerzyć enum — zrobię, ale wtedy tym bardziej potrzebuję najpierw
migracji 116/117 w repo, żeby nie tworzyć konkurencyjnej migracji o tym samym numerze.

### 3.3. Zajęcia indywidualne bez wyboru nauczyciela — zgadzam się, i to mocno

Ta decyzja z briefu jest spójna z tym, co wyszło w danych: siedmiu nauczycieli bez grafiku,
brak pola języka, `levels` puste u wszystkich. Do tego rzecz, którą znalazłem wcześniej —
publiczny kalendarz **nie odejmuje już zapisanych lekcji**, więc w najbliższych 7 dniach pokazuje
7 godzin jako wolne, mimo że lekcja jest tam umówiona. Samodzielny wybór slotu byłby dziś
obietnicą bez pokrycia. Kierunek „lead do rozmowy diagnostycznej" jest właściwy.

### 3.4. Czego brakuje w `leads` pod ten projekt

Do dodania (jedna migracja, po ustaleniu numeracji): **lokalizacja** (Rumianek / online) z Kroku 2
i **wybrana grupa** (referencja do `groups`) z Kroku 4. Bez nich Kroki 2 i 4 nie mają gdzie
zapisać swojego wyniku.

---

## 4. BLOK 4 — ujednolicenie wejść: jedno z czterech jest zepsute

Stan faktyczny czterech wejść:

| Wejście | Gdzie | Zapisuje do | Stan |
|---|---|---|---|
| Modal konsultacji | `/pl/*`, `ConsultationModal.js` | `consultation_requests` | działa |
| Kreator | `/zapisy` | `students` + `group_members` / `lessons` / `booking_requests` | działa |
| Formularz B2B | `/pl/companies` | `b2b_leads` | działa |
| **Formularz kontaktowy** | `/pl/contact`, `ContactForm.js:36` | **`/api/contact`** | **ZEPSUTY** |

**`/api/contact` nie istnieje.** Nie ma go w `src/app/api/` i nigdy nie było w historii gita.
Formularz wysyła POST pod nieistniejący endpoint, dostaje błąd, pokazuje użytkownikowi komunikat
o niepowodzeniu — i **każde zgłoszenie z tej strony przepada bezpowrotnie**. Nic nie trafia do
żadnej tabeli.

To nie było w briefie, a jest to najpilniejsza pojedyncza rzecz z całego dokumentu: strona kontaktu
jest w nawigacji i zbiera zero.

### Obietnice czasu odpowiedzi — potwierdzone

| Miejsce | Tekst | Plik |
|---|---|---|
| Modal konsultacji | „w ciągu jednego dnia roboczego" | `pl.js:840`, `pl.js:852` |
| Strona kontaktu | „odpowiemy w ciągu jednego lub dwóch dni" | `pl.js:728` |

Do ujednolicenia na krótszą, zgodnie z Twoim poleceniem — po Twoim potwierdzeniu, że jeden dzień
roboczy jest realny także dla kontaktu.

---

## 5. Co zrobię po Twoim „tak" — kolejność

**Najpierw, poza kolejnością bloków (proponuję):** naprawić `/api/contact`. Jedna godzina pracy,
zatrzymuje realny wyciek zgłoszeń.

**Blok 1 — naprawa danych.** Kolejno: (a) publiczny licznik miejsc omijający RLS,
(b) flaga `is_bookable_online` dla siedmiu osób bez grafiku, (c) kolumna języka w `teachers`
i `groups` — sama kolumna, dane od Ciebie, (d) nazwy i opis dwóch grup dla dorosłych — po Twojej
decyzji. Każdy krok jako SQL do wglądu **przed** uruchomieniem na produkcji.

**Blok 2 — zatrzymanie.** Czekam na decyzję o podmiocie. Nie ruszam dalej bez niej.

**Blok 3 — kreator**, krok po kroku, z podglądem po każdym.

**Blok 4 — ujednolicenie**, po rozstrzygnięciu sprawy migracji 116/117.

---

## 6. Czego potrzebuję od Ciebie, żeby ruszyć

1. **Migracje 116/117** — dociągnięte do tego repo, albo zgoda na wariant „cienki adapter".
2. **Podmiot prawny** — A czy B (§2).
3. **Poziomy nauczycieli** — lista poniżej do uzupełnienia.
4. **Języki nauczycieli** — Adriana i Stefania mam od Ciebie; potrzebuję pozostałych 11
   i decyzji, czy jeden język czy kilka na osobę.
5. **Dwie grupy dla dorosłych** — zostawiamy obie z nowymi nazwami, czy jednak jedna znika.
6. **Jeden dzień roboczy** — czy realnie dotrzymywalny również dla formularza kontaktowego.

### Poziomy i języki — do ręcznego uzupełnienia

| Nauczyciel | Poziomy (CEFR) | Język | Grafik online |
|---|---|---|---|
| Tim | | | 30 slotów |
| Nick | | | 10 slotów |
| Gio | | | 7 slotów |
| Toni | | | 6 slotów |
| Yan | | | 6 slotów |
| Shakina | | | 2 sloty |
| Adriana | | hiszpański *(od Ciebie)* | brak |
| Bertie | | | brak |
| Elliott | | | brak — ale uczy 56 lekcji |
| Jack | | | brak — ale uczy 128 lekcji |
| Mada | | | brak — ale uczy 21 lekcji |
| Michelle | | | brak |
| Stefania | | niemiecki *(od Ciebie)* | brak |

---

**Poza zakresem, odnotowane i nietknięte:** strona uNickorna jako korepetytora AI. Zauważyłem
`meetUnickorn` w słownikach i katalog `src/app/[locale]/meet-unickorn` — nie ruszam, nie podłączam,
nie dodaję do nawigacji.
