# Przegląd przed wrześniem: architektura serwisu i stan prac

Data: 2026-08-04 · Gałąź: `claude/signup-process-optimization-b8ta9c`
Status: **przegląd zakończony, czekam na decyzję architektoniczną. Nic nie zmienione.**

---

## 0. Rzecz, która tłumaczy cały Twój audyt

**Poprzednia praca nigdy nie trafiła na produkcję.** Siedem commitów siedzi na gałęzi
`claude/signup-process-optimization-b8ta9c`; `main` stoi na `e804e8d`, a produkcja deployuje
się z `main`. Fetch przez Vercel pokazał Ci więc stan sprzed tamtych zmian — i Twój audyt jest
w tych punktach **całkowicie poprawny wobec produkcji**.

Konkretnie, na produkcji nadal jest to, co opisałaś:

| Twoja obserwacja | Na produkcji | Na gałęzi |
|---|---|---|
| Kreator zaczyna od „indywidualnie czy grupowo" | tak | przebudowany na 5 kroków |
| Wszystkie grupy `taken: 0, spots: 8` | tak | naprawione |
| Trzy różne obietnice czasu odpowiedzi | tak | ujednolicone (2 dni robocze) |
| Regulamin: dwa różne podmioty | tak | ujednolicone (UAI / UA) |
| Formularz kontaktowy | wysyła w próżnię | naprawiony |

**Jeden wyjątek: baza danych JEST już zmieniona.** Migracje 120 i 121 zaaplikowałam na
produkcyjnym Supabase. Nic się przez to nie psuje (wdrożony kod nie używa nowych kolumn), ale
dwie zmiany są już widoczne dla klienta: grupy nazywają się teraz
„Wiecznie Początkujący Dorosły · online" i „· stacjonarnie".

**Decyzja do podjęcia przy okazji tej architektonicznej:** czy scalamy tamtą gałąź, czy
zaczynamy od nowa na jej fragmentach. Rekomendacja: scalić, bo Bloki 1, 2, 3 i 5 z obecnego
briefu są tam w większości zrobione (zestawienie w §4).

---

## 1. Architektura: stan faktyczny jest inny, niż wygląda z zewnątrz

Twoja diagnoza „dwa równoległe serwisy" jest trafna co do wrażenia klienta, ale **Serwis B jest
już w dwóch trzecich wygaszony** — tylko nie widać tego z zewnątrz, bo zrobiono to
przekierowaniami w `next.config.ts`, nie usunięciem kodu.

### Co naprawdę jest osiągalne

| URL | Co się dzieje | Efekt |
|---|---|---|
| `/` | redirect → `/pl` | Serwis A jest stroną główną |
| `/dla-firm` | **301 → `/pl/companies`** | strona Serwisu B nieosiągalna |
| `/nauczyciele` | **301 → `/pl/meet-us`** | strona Serwisu B nieosiągalna |
| `/kontakt` | 302 → `/pl/contact` | Serwis A |
| `/polityka-prywatnosci` | 302 → `/pl/privacy-policy` | Serwis A |
| `/regulamin` | 302 → `/pl/terms-of-service` | Serwis A |
| `/dla-siebie` | działa | Serwis B |
| `/kursy` | działa | Serwis B |
| `/zapisy` | działa | Serwis B |

Czyli z Serwisu B realnie żyją **trzy strony**: `/dla-siebie`, `/kursy`, `/zapisy`.
Reszta to martwy kod za przekierowaniem.

### Trzy konsekwencje, których nie było w briefie

**1.1. Formularz B2B jest nieosiągalny — i to psuje realny przychód.**
Jedyny formularz zapisujący do `b2b_leads` żyje w `(public)/dla-firm/B2bInquiryForm.tsx`.
Ta strona jest zasłonięta przekierowaniem 301 na `/pl/companies`, a `/pl/companies`
**nie ma żadnego formularza** — ma przycisk konsultacji (`ConsultationButton audience="company"`),
który pisze do zupełnie innej tabeli. Firma, która chce zapytać o szkolenie, nie ma jak.

**1.2. Analityka nie obejmuje strony zapisu.**
GA4 (`G-RZZD2NLW6F`, poprawnie bramkowane zgodą z banera) ładuje się **wyłącznie
w `[locale]/layout.js`**. Serwis B nie ma własnego wywołania — więc `/zapisy`, czyli jedyne
miejsce, gdzie dochodzi do konwersji, **jest całkowicie nieśledzone**. To nie jest brak
zdarzeń niestandardowych; to brak jakiegokolwiek pomiaru. Reklamy uruchomione w tym stanie
będą ślepe co do jedynej rzeczy, która się liczy.

**1.3. Błąd, który sama wprowadziłam na gałęzi.**
Utworzyłam `(public)/regulamin/page.tsx` (publiczna strona regulaminu z bazy) i podlinkowałam
ją z kreatora. Ale `/regulamin` ma w `next.config.ts` przekierowanie na `/pl/terms-of-service`,
a przekierowania wykonują się **przed** routingiem — więc moja strona jest nieosiągalna,
a klient akceptujący regulamin trafia do **innego dokumentu** (tego ze słowników Serwisu A)
niż ten, którego wersję zapisujemy w `consent_acceptances`. Do naprawy przy scalaniu.

---

## 2. Rekomendacja architektoniczna

**Popieram Twoją preferencję — Serwis A jako warstwa marketingowa, Serwis B sprowadzony do
funkcji aplikacyjnych — i po przeglądzie uważam, że jest to jedyny rozsądny wariant.**
Zakres pracy jest przy tym mniejszy, niż wygląda, bo połowa wygaszenia już się wydarzyła.

### Wariant 1 (rekomendowany): A = marketing, B = aplikacja w skórze A

**Co tracimy w SEO:** nic. Wszystkie indeksowane adresy zostają nietknięte.

**Zakres pracy:**
- `/zapisy` i `/login` dostają Navbar i stopkę z Serwisu A. Te komponenty przyjmują `dict`
  i `locale`, więc da się je zaimportować do `(public)/layout.tsx` z polskim słownikiem —
  bez przenoszenia `/zapisy` pod `[locale]`, co byłoby dużo większą operacją.
- `/dla-siebie` i `/kursy` — 301 na odpowiedniki w Serwisie A (`/pl/adults`, `/pl/how-we-teach`).
  Nie ma ich w sitemapie, więc strata SEO zerowa, a znikają dwa źródła sprzecznych treści
  (w tym wymyślone opisy założycieli — §3).
- Ratunek formularza B2B: przenieść `B2bInquiryForm` na `/pl/companies` i zdjąć 301 z `/dla-firm`
  albo zostawić 301 i osadzić formularz w A. Rekomenduję to drugie — jeden adres, ten z SEO.
- Usunąć martwy kod `(public)/dla-firm` i `(public)/nauczyciele` po przeniesieniu formularza.

**Szacunek:** około jednego dnia pracy, plus pół dnia na formularz B2B.

### Wariant 2: B zastępuje A

**Co tracimy:** structured data (`EducationalOrganization` + `LocalBusiness`), `areaServed`
z dwunastoma miejscowościami, canonical, hreflang PL/EN, unikalne metadane na każdej podstronie,
sitemapę, wszystkie treści sprzedażowe (`/pl/children`, `/pl/adults`, `/pl/teenagers`,
`/pl/companies`, `/pl/how-we-teach`, `/pl/meet-us`) oraz lokalną stronę docelową
`/pl/szkola-jezykowa-tarnowo-podgorne`. Serwis B ma jeden generyczny title i description na
wszystkich podstronach.

**Szacunek:** tygodnie odbudowy, przy pewnej utracie pozycji. **Odradzam stanowczo**,
zwłaszcza cztery tygodnie przed wrześniem.

### Wariant 3: zostawić jak jest

To jest dzisiejszy stan i dzisiejszy wyciek. Odradzam.

---

## 3. Błędy rzeczowe o założycielach — zestawienie do zatwierdzenia

Sprawdziłam źródła. Wersja z Serwisu A jest spójna z bazą; wersja z Serwisu B jest wymyślona.

### Nick — sprzeczność co do kraju

| Źródło | Treść |
|---|---|
| Baza, `teachers.bio` | „**Wielka Brytania.** Nick jest nauczycielem z ponad 10-letnim doświadczeniem (…). **Pochodzi z Anglii** i specjalizuje się w nauczaniu dorosłych na każdym poziomie" |
| Serwis A, historia założycieli | Nick prowadził „**English with an Englishman**" |
| Serwis B, `/dla-siebie:143` | „**Irlandzki charakter szkoły.** Przynosi do klasy prawdziwy angielski ze świata. Fan footballu i dobrej herbaty." |

Dwa niezależne źródła mówią Anglia. **„Irlandzki charakter" jest po prostu błędem** i tekst
z `/dla-siebie` proponuję usunąć razem ze stroną (Wariant 1 i tak ją wygasza).

### Milly — opis bez pokrycia

| Źródło | Treść |
|---|---|
| Serwis B, `/dla-siebie:142` | „Polska dusza szkoły. Tłumaczy angielski tak, żeby miał sens w polskiej głowie. **Uwielbia kawy i lingwistykę.**" |
| Serwis A, historia założycieli | Milena pracowała w korporacji, straciła pracę, dołączyła do szkoły; zauważyła, że dzieci mówią po angielsku chętniej z Nickiem niż z nią, bo mózg widzi naturalną potrzebę — i z tego wyszła metoda szkoły |

Historia z Serwisu A jest konkretna, prawdziwa i sprzedaje. Wersja z B to wypełniacz.

**Moja propozycja: nie przepisywać ich w Serwisie B, tylko wygasić `/dla-siebie`** na rzecz
`/pl/adults`, gdzie prawdziwa historia już jest. Jeśli wolisz zachować `/dla-siebie`, przygotuję
propozycję tekstów opartą na Serwisie A — do Twojego zatwierdzenia, nie automatem.

---

## 4. Co z obecnego briefu jest już zrobione (na gałęzi)

| Punkt briefu | Stan |
|---|---|
| 1.2 Podmiot prawny — lista miejsc | **zrobione**, lista w `docs/ZAPISY_PRZEGLAD_I_PLAN.md` §2 |
| 1.2 Ujednolicenie podmiotów | **zrobione** wg Twojej decyzji: B2C = UAI, B2B = UA, w PL i EN |
| 1.4 Jedna obietnica czasu | **zrobione** — „do 2 dni roboczych"… *ale* CTA „24h" na `/dla-siebie` **zostało pominięte** (nie było w tamtym briefie) |
| 2.1 Liczniki miejsc | **zrobione** — przyczyną było RLS, nie brak podłączenia (szczegóły niżej) |
| 2.2 Nauczyciele bez dostępności nie w kreatorze | **zrobione** (flaga `is_bookable_online`) |
| 2.2 Zdjęcia, bio, sortowanie, wskaźnik kompletności | **nie zrobione** — nowe w tym briefie |
| 2.3 Poziomy nauczycieli | **zrobione przez usunięcie** — kreator nie wybiera już nauczyciela, więc nie pyta o poziom pod jego kątem |
| 2.4 Języki | **zrobione** (kolumna + dane: Adriana `es`, Stefania `de`) |
| Blok 3 Kreator, 5 kroków | **zrobione** w całości, łącznie ze ścieżką „jeszcze nie wiem" |
| Blok 3 Automatyzacja po zapisie | **zrobione** (mail natychmiast, doba, trzy dni przed) |
| Blok 5 Jeden lejek | **zrobione dla 3 z 3 realnych wejść** |
| 4.1 SEO | nietknięte — czeka na decyzję z §2 |
| 4.2 Strony grup | **nie zrobione** |
| 4.3 Cena widoczna | częściowo — cena jest w kreatorze przy każdej grupie; poza kreatorem nie |
| 4.4 Śledzenie konwersji | **nie zrobione** — i jest gorzej, niż zakładałaś (§1.2) |
| 4.5 Treść obalająca obawy w kreatorze | **nie zrobione** |
| 4.6 Dowód społeczny przy decyzji | **nie zrobione** |
| 4.7 Mobile i źródło zdjęć | **nie zrobione** |

### Korekta do punktu 2.1

`taken` **było** podłączone do realnych zapisów — kod liczył poprawnie. Zawodziła polityka RLS:
członkostwa są widoczne „dla zalogowanych", a strona publiczna czyta bazę anonimowo, więc
Supabase zwracał pustą tablicę **bez błędu**. Stąd `0/8` wszędzie. Naprawione funkcją
zwracającą wyłącznie liczby, bez rozluźniania dostępu do danych uczniów.

Realne obłożenie: **3 osoby na 104 miejsca**. Warto to wiedzieć przed włączeniem reklam —
komunikat „zostały 3 miejsca" nie będzie prawdziwy dla żadnej grupy, bo prawie wszystkie są puste.
Uczciwym bodźcem będzie raczej data startu i wielkość grupy („maksymalnie 8 osób"), a nie
kurczące się miejsca.

### Korekta do punktu 5

Wejść jest **trzy, nie cztery**. Sprawdziłam `/pl/how-we-teach`: nie ma tam przycisków
„Zapisz się" ani „Lista rezerwowa" przy grupach — jedynym CTA jest przycisk konsultacji, czyli
to samo wejście co modal. Wszystkie trzy realne wejścia piszą już do `leads` na gałęzi.

---

## 5. Proponowana kolejność na cztery tygodnie

Zakładam scalenie gałęzi jako punkt wyjścia — bez tego połowę poniższego trzeba by pisać od nowa.

### Tydzień 1 — bez tego nie warto włączać reklam
1. Decyzja architektoniczna (§2) i scalenie gałęzi.
2. Naprawa `/regulamin` (§1.3) — inaczej akceptujemy jeden dokument, a pokazujemy drugi.
3. **Śledzenie konwersji na `/zapisy`** — dziś zero. Zdarzenia: start kreatora, ukończenie
   każdego kroku, wysłanie. Parametr kampanii z reklamy do `leads.campaign` (kolumna gotowa).
4. Ratunek formularza B2B (§1.1).
5. CTA „24h" na `/dla-siebie` — znika razem ze stroną albo zostaje poprawione.

### Tydzień 2 — spójność i widoczność
6. Navbar i stopka z Serwisu A na `/zapisy` i `/login`.
7. Wygaszenie `/dla-siebie` i `/kursy` (301), usunięcie martwego kodu.
8. Degradacja przy niekompletnych profilach nauczycieli (zdjęcie, bio, sortowanie).
9. Wskaźnik kompletności w panelu nauczyciela + lista braków w panelu admina.

### Tydzień 3 — pozyskiwanie
10. Strony grup pod `/zajecia/<slug>` ze schematem `Course` i metadanymi.
11. Cena widoczna poza kreatorem: strony grup, strona oferty, FAQ.
12. Ujednolicenie źródła zdjęć nauczycieli (5 z WordPressa, 5 z Supabase, 3 brak).

### Tydzień 4 — dopieszczenie i zapas
13. Treść obalająca obawy wpleciona w kreator.
14. Dowód społeczny przy decyzji.
15. Mobile i czas ładowania.
16. Bufor na to, co wyjdzie w testach.

**Uwaga o tempie:** punkty 13–15 są najmniej pilne. Jeśli coś ma wypaść, niech wypadną one,
a nie punkty 3 i 10 — pomiar i strony docelowe są tym, co realnie zamienia budżet reklamowy
w uczniów.

---

## 6. Czego potrzebuję od Ciebie, żeby ruszyć

1. **Decyzja architektoniczna** (§2) — rekomenduję Wariant 1.
2. **Czy scalamy gałąź** `claude/signup-process-optimization-b8ta9c` do `main`.
3. **`/dla-siebie`** — wygaszamy na rzecz `/pl/adults`, czy zachowujemy z poprawionymi tekstami.
4. **Formularz B2B** — osadzić w `/pl/companies` (rekomendacja), czy zdjąć 301 z `/dla-firm`.
5. **Podmiot prawny** — decyzja z poprzedniej sesji (B2C = UAI, B2B = UA) jest już wdrożona
   na gałęzi. Potwierdź, że nadal obowiązuje.

Do rozstrzygnięcia później, nie blokuje: czy komunikujemy hiszpański i niemiecki jako ofertę.

---

**Poza zakresem, nietknięte:** strona uNickorna jako korepetytora AI. Katalog
`[locale]/meet-unickorn` istnieje i jest w sitemapie — jeśli ma być wstrzymana, warto ją z tej
sitemapy wypiąć, ale nie ruszam bez Twojego słowa.
