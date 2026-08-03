# Zapisy (/zapisy) — audyt procesu i plan optymalizacji

Data: 2026-08-03
Zakres: `src/app/(public)/zapisy/*`, `src/app/api/booking/route.ts`, `src/app/(admin)/admin/zapisy/*`,
funkcje RPC `public_enroll_group` / `public_book_online` / `public_stationary_request`, dane produkcyjne.

---

## 1. Podsumowanie

Kreator działa technicznie poprawnie, ale jest zbudowany wokół **struktury naszego systemu**, a nie wokół
decyzji, którą podejmuje rodzic. Trzy rzeczy robią największą szkodę:

1. **Ścieżka indywidualna nie pokazuje ceny — nigdzie.** Klient przechodzi 6 ekranów, podaje dane,
   akceptuje regulamin i klika „Potwierdź zapis", nie wiedząc, ile to kosztuje. Cenę wpisuje ręcznie
   admin dopiero po fakcie (`OnlineBookingsView.tsx:110-119`, puste pola z placeholderem „np. 90").
   Tabela `pricing_plans` z cenami 80 / 75 / 70 zł za lekcję istnieje w bazie i **nie jest używana**.
2. **Ścieżka grupowa robi odwrotny błąd — cena zaskakuje.** Podsumowanie przed wysłaniem pokazuje samą
   nazwę grupy (`BookingWizard.tsx:371`), przycisk mówi „Potwierdź zapis", a zaraz po kliknięciu leci
   przekierowanie na Stripe z kwotą 250 zł (`api/booking/route.ts:128`). To klasyczny moment porzucenia
   koszyka i źródło reklamacji.
3. **Zapis to nie jest jeden proces, tylko cztery różne procesy w czterech różnych tabelach.**
   Grupa → `group_members` (bez akceptacji, od razu płatność). Online → 12 niepotwierdzonych rekordów
   w `lessons`. Stacjonarnie → `booking_requests`. Konsultacja → `consultation_requests`.
   Stąd bierze się „brak flow" — bo flow faktycznie nie ma, są trzy równoległe.

Efekt liczbowy: **10 akceptacji regulaminu** (`consent_acceptances`) przy 146 uczniach w bazie i
36 niepotwierdzonych lekcji wiszących w kalendarzu.

---

## 2. Jak wygląda ścieżka dziś

### Ścieżka A — grupowo (3 ekrany, ~7 interakcji)

```
start ──► groupPick ──► form ──► [Stripe 250 zł, bez ostrzeżenia]
```

### Ścieżka B — indywidualnie online (6 ekranów, ~9 interakcji, 0 informacji o cenie)

```
start ──► mode ──► onlineSearch ──► teacher ──► onlineSlot ──► form ──► „skontaktujemy się"
          (Online/    („Po nauczycielu   (13 osób,    (godziny +
         Stacjonarnie)  czy po terminie?") 7 ślepych   „ongoing")
                                            zaułków)
```

### Ścieżka C — indywidualnie stacjonarnie (4 ekrany, 91 checkboxów)

```
start ──► mode ──► offlineGrid ──► form ──► „skontaktujemy się"
                   (7 dni × 13 godzin
                    = 91 komórek 24 px)
```

Nigdzie nie ma paska postępu, więc klient nie wie, czy jest w połowie, czy na początku.
Odświeżenie strony kasuje wszystko.

---

## 3. Co blokuje klienta

Priorytety: **P0** = kosztuje sprzedaż dziś, **P1** = duże tarcie, **P2** = szlif.

### P0 — brak ceny przy lekcjach indywidualnych
`BookingWizard.tsx` — ani ekran wyboru terminu, ani podsumowanie, ani przycisk nie zawierają kwoty.
Ludzie nie zostawiają danych pod niewiadomą cenę. To najprawdopodobniej największy pojedynczy wyciek
w całym lejku.

### P0 — zaskoczenie płatnością przy grupach
Podsumowanie (`:371`) pokazuje `Row label="Grupa"` bez ceny. Przycisk: „Potwierdź zapis".
Następny ekran: Stripe, 250 zł. Klient nie miał szansy się przygotować.

### P0 — „Po nauczycielu czy po terminie?" (`:248-253`)
To pytanie o mechanikę interfejsu, nie o potrzebę klienta. Cały ekran, na którym nikt nic nie zyskuje.
Do usunięcia — jeden widok kalendarza z filtrem nauczyciela załatwia oba przypadki.

### P0 — 7 z 13 nauczycieli to ślepy zaułek
W bazie: 13 aktywnych nauczycieli, **6 z ustawionym grafikiem**. Ekran „Wybierz nauczyciela" pokazuje
wszystkich; po kliknięciu 7 z nich klient dostaje „Ten nauczyciel nie ma jeszcze ustawionego grafiku.
Wróć i wybierz innego." (`:285`). Ślepa uliczka w środku ścieżki zakupowej.

### P0 — „Lista rezerwowa", której nie ma
Grupa bez miejsc dostaje badge „Lista rezerwowa", ale przycisk jest `disabled` (`:214`), a RPC i tak
rzuciłoby wyjątek („Brak wolnych miejsc w grupie"). Obiecujemy listę rezerwową i nie zbieramy nawet
e-maila. Czysta strata leada.

### P1 — pierwsze pytanie jest za wcześnie
„Jak chcesz się uczyć? Indywidualnie / Grupowo" (`:162`) wymaga decyzji, zanim klient zobaczy
jakąkolwiek ofertę, cenę czy termin. Brakuje też trzeciej opcji, w której jest większość rodziców:
**„Nie wiem, doradźcie mi"**.

### P1 — karta grupy nie pokazuje dnia tygodnia
`schedule_text` w bazie to samo „18:30", „16:30" itd. Dzień siedzi w osobnej kolumnie `day_of_week`,
jest pobierany (`queries.ts:797`), używany do sortowania i filtra — **ale nie jest renderowany na karcie**
(`BookingWizard.tsx:233`). Klient widzi „18:30" i nie wie, w jaki dzień. To realny błąd, nie kosmetyka.
Podobnie `start_date` / `end_date` (migracja 113) nie są w ogóle wyciągane do widoku publicznego —
nie wiadomo, kiedy grupa startuje.

### P1 — siatka dostępności stacjonarnej jest nieklikalna na telefonie
`OfflineGrid` — 91 komórek o wysokości 24 px (`:457`). Minimum dla dotyku to 44 px. I jest to
**pierwszy** ekran tej ścieżki, jeszcze przed podaniem imienia. Wystarczą 3 presety
(„popołudnia w tygodniu", „wieczory", „weekendy") + opcjonalne doprecyzowanie.

### P1 — „ongoing" i zły domyślny wybór
Przycisk „Co tydzień (ongoing)" (`:301`) — żargon w interfejsie klienta. Do tego domyślnie wybrane jest
**„Jednorazowo"** (`ongoing = false`), czyli domyślnie sprzedajemy pojedynczą lekcję zamiast kursu.
Domyślne powinno być „co tydzień", z jednorazową jako alternatywą.

### P1 — konto zakładane przez „zapomniane hasło"
Ekran sukcesu (`:147-151`): „Aby ustawić hasło, wejdź na /zapomniane-haslo i podaj swój email".
Wysyłamy świeżo zapisanego klienta do funkcji odzyskiwania hasła, którego nigdy nie miał.
Powinien iść automatyczny link ustawiający hasło (magic link) w mailu potwierdzającym.

### P1 — jedno pole na dwie różne osoby
`fullName: studentName, childName: studentName` (`:112`). Pole „Imię i nazwisko ucznia" trafia
jednocześnie jako opiekun i jako dziecko. W bazie nie da się odróżnić rodzica od ucznia,
a konto zakładane jest na dane dziecka.

### P1 — brak walidacji
Sprawdzamy tylko `!studentName || !email` (`:107`). Literówka w e-mailu = lead stracony bezpowrotnie,
bo to jedyny kanał kontaktu (telefon jest opcjonalny).

### P1 — kod rabatowy tylko przy online
Pola „Kod polecenia" / „Kod rabatowy" pokazują się wyłącznie dla `kind === 'online'` (`:362`).
Osoba z kodem zapisująca się do grupy — gdzie od razu płaci 250 zł — nie ma gdzie go wpisać.
Efekt: telefon do szkoły i ręczna korekta.

### P2 — pozostałe
- Brak paska postępu („krok 2 z 4").
- Brak zapisu stanu — odświeżenie kasuje wszystko.
- Filtr „Wiek dziecka" wyklucza dorosłych szukających dla siebie (5 z 13 grup to 18+).
- Regulamin wklejony jako tekst w `<details>`, bez linku do PDF.
- Przycisk „Bezpłatna konsultacja" konkuruje z zapisem na górze strony, zamiast ratować niezdecydowanych.

---

## 4. Co kosztuje nas czas (strona operacyjna)

### O1 — jeden lead = 12 rekordów w `lessons`
`public_book_online` tworzy od razu `p_weeks = 12` lekcji z `is_confirmed = false` (migracja 115).
Zapytanie o zapis zapycha kalendarz zanim ktokolwiek je zaakceptuje — stąd 36 wiszących lekcji.
Odrzucenie musi je kasować. Powinno być odwrotnie: **lead → jeden rekord zgłoszenia → lekcje dopiero
po akceptacji.**

### O2 — cztery skrzynki zamiast jednej
| Ścieżka | Trafia do | Gdzie admin to widzi |
|---|---|---|
| Grupa | `group_members` (od razu) | `/admin/studenci` |
| Online | `lessons` (`is_confirmed=false`) | `/admin/zapisy#online` |
| Stacjonarnie | `booking_requests` | `/admin/zapisy#stacjonarne` |
| Konsultacja | `consultation_requests` | osobno |
| B2B | `b2b_leads` | osobno |

Pięć tabel, kilka ekranów, brak wspólnego statusu i kolejki. To jest główne źródło wrażenia
„brak sprawności" — nie ma jednego miejsca, w którym widać „co czeka na nas dzisiaj".

### O3 — cena ustalana ręcznie przy każdym zatwierdzeniu
`firstAmount` i `monthlyPrice` to puste pola do wypełnienia przy **każdym** zapisie
(`OnlineBookingsView.tsx:110-119`). Ryzyko niespójnych cen między klientami + czas admina.
`pricing_plans` (80 / 75 / 70 zł za lekcję zależnie od częstotliwości) leży nieużywane.

### O4 — śmieciowe dane wejściowe
`level: 'A1'` zaszyte na sztywno w obu ścieżkach (`BookingWizard.tsx:122`, `route.ts:149`).
Wiek nie jest zbierany w ogóle. Efekt: każdy uczeń w bazie jest „A1", a poziom i wiek trzeba dopytać
mailem lub telefonem — czyli ta praca i tak jest wykonywana, tylko ręcznie i później.

### O5 — powiadomienia bez SLA
Każdy zapis wysyła trzy powiadomienia (dzwonek + SMS + e-mail), ale nic nie przypomina, że zgłoszenie
czeka trzeci dzień. Brak eskalacji = leady stygną.

### O6 — brak śledzenia źródła
`source` jest zaszyte jako `'zapisy_online'` / `'zapisy_grupa'`. Nie wiadomo, z której kampanii,
strony czy kanału przyszedł klient. Nie da się ocenić, co działa.

### O7 — grupy: płatność przed zebraniem grupy
12 z 13 aktywnych grup ma 0–1 zapisanych osób. Klient płaci 250 zł z góry za grupę, która może nie
wystartować → zwroty i tłumaczenie się. Bezpieczniej: rezerwacja miejsca + płatność w momencie
potwierdzenia startu grupy (lub niższa zaliczka).

---

## 5. Proponowany nowy proces

### Zasada: **3 kroki, cena widoczna od początku, jeden lead = jeden rekord.**

```
KROK 1 — „Dla kogo i czego szukasz?"
  • Dla dziecka (wiek) / Dla siebie / Dla firmy
  • od razu widoczne: „od 199 zł/mies. w grupie · od 70 zł za lekcję indywidualną"

KROK 2 — „Wybierz z dostępnych opcji"  (jedna lista, nie trzy ścieżki)
  • karty przefiltrowane odpowiedzią z kroku 1
  • grupy i terminy indywidualne obok siebie, każda karta z: dzień + godzina + cena +
    data startu + forma (online/stacjonarnie) + nauczyciel
  • zawsze na końcu listy: „Nie widzę nic dla siebie → zostaw kontakt, dobierzemy termin"
    (to zastępuje dzisiejszą ścieżkę stacjonarną i siatkę 91 komórek)

KROK 3 — „Twoje dane i potwierdzenie”
  • imię rodzica + imię i wiek ucznia (osobno) + e-mail + telefon (wymagany)
  • kod rabatowy/polecenia — dostępny w KAŻDEJ ścieżce
  • podsumowanie z jawną kwotą i przyciskiem: „Zapisz się i zapłać 250 zł”
    albo „Wyślij zgłoszenie — odezwiemy się w 24 h” (gdy cena wymaga ustalenia)
```

Co znika: ekran „Indywidualnie/Grupowo", ekran „Online/Stacjonarnie", ekran „Po nauczycielu czy po
terminie?", siatka 91 checkboxów. **Z 6 ekranów robią się 3, z ~9 kliknięć ~5.**

### Po stronie systemu

1. **Jedna tabela `signups`** — wszystkie zgłoszenia (grupa / indywidualne / „dobierzcie mi termin” /
   konsultacja) z polami: `channel`, `status`, `assigned_to`, `utm_*`, `price_quoted`, `created_at`.
   Lekcje i członkostwa powstają dopiero przy `status = 'accepted'`.
2. **Jeden ekran `/admin/zapisy`** = kolejka „do zrobienia dziś", posortowana po czasie oczekiwania,
   z licznikiem SLA i przyciskiem „Akceptuj” / „Zaproponuj inny termin” / „Odrzuć”.
3. **Cena z `pricing_plans`** podpowiadana automatycznie (1× / 2× / 3× tydzień → 80/75/70 zł),
   admin tylko potwierdza lub nadpisuje. Zero pustych pól.
4. **Lead zapisywany po kroku 1** (e-mail zbierany wcześniej lub przez exit-intent) — dzięki temu
   mamy kontakt do osób, które odpadły w połowie. Dziś nie mamy żadnego.
5. **Ukrywanie nauczycieli bez grafiku** z listy publicznej — jedna linia filtra, znika 7 ślepych zaułków.
6. **Lista rezerwowa naprawdę zbierana** dla pełnych grup (`waitlist` + powiadomienie, gdy zwolni się miejsce).
7. **Automatyczny magic link** ustawiający hasło w mailu potwierdzającym — zamiast odsyłania
   do „zapomniane hasło".
8. **Przypomnienie po 24 h**, gdy zgłoszenie nie zostało obsłużone (cron już istnieje:
   `api/cron/reminders`).

---

## 6. Plan wdrożenia

### Etap 1 — szybkie wygrane (~1 dzień, bez zmian w bazie)
Największy zwrot na włożoną pracę. Nic tu nie wymaga migracji.

- [ ] Cena na karcie grupy w podsumowaniu + przycisk „Zapisz się i zapłać 250 zł”
- [ ] Dzień tygodnia na karcie grupy (`dayOfWeek` już jest w danych, wystarczy wyrenderować)
- [ ] Ukrycie nauczycieli bez grafiku z listy wyboru
- [ ] Usunięcie ekranu „Po nauczycielu czy po terminie?” → od razu kalendarz z filtrem
- [ ] Domyślnie „co tydzień” zamiast „jednorazowo”; usunięcie słowa „ongoing”
- [ ] Widełki cenowe przy lekcjach indywidualnych („od 70 zł / lekcja”) z `pricing_plans`
- [ ] Kod rabatowy/polecenia we wszystkich ścieżkach
- [ ] Walidacja e-maila i telefonu; telefon wymagany
- [ ] Pasek postępu „Krok 2 z 3”
- [ ] Presety dostępności zamiast siatki 91 komórek

### Etap 2 — porządek w danych (~2 dni, wymaga migracji)
- [ ] Rozdzielenie pól rodzic / uczeń + wiek + poziom (zamiast zaszytego `A1`)
- [ ] Tabela `signups` jako wspólna skrzynka; zgłoszenia online przestają tworzyć 12 lekcji z góry
- [ ] Zapis `utm_source` / `utm_medium` / strona wejścia
- [ ] Prawdziwa lista rezerwowa dla pełnych grup
- [ ] Magic link ustawiający hasło zamiast „zapomniane hasło”

### Etap 3 — automatyzacja pracy (~2 dni)
- [ ] `/admin/zapisy` jako jedna kolejka z SLA i statusami
- [ ] Automatyczna podpowiedź ceny z `pricing_plans`
- [ ] Przypomnienie po 24 h o nieobsłużonym zgłoszeniu
- [ ] Potwierdzenie WhatsApp do klienta (integracja Make już jest)
- [ ] Zapis leada porzuconego w połowie + sekwencja follow-up

---

## 7. Co mierzyć po wdrożeniu

| Wskaźnik | Jak liczyć | Dziś |
|---|---|---|
| Konwersja wejście → zapis | odsłony `/zapisy` → `consent_acceptances` | 10 akceptacji łącznie |
| Porzucenia per krok | zdarzenie na wejściu w każdy ekran | brak pomiaru |
| Czas do obsługi zgłoszenia | `created_at` → `status = accepted` | brak pomiaru |
| Udział zapisów cyklicznych | `ongoing = true` / wszystkie online | brak pomiaru |
| Zapełnienie grup | `group_members` / `capacity` | 3 / 104 miejsc |

Bez pierwszych dwóch pozycji każda kolejna zmiana będzie zgadywaniem — warto wpiąć zdarzenia
już w Etapie 1.
