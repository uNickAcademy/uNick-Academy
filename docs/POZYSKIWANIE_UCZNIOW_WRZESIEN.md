# Pozyskiwanie uczniów na wrzesień — strategia po weryfikacji danych

Data: 2026-08-04 · Do startu grup: **4 tygodnie** (1 września)
Status: przemyślenie planu z `docs/WRZESIEN_PRZEGLAD_ARCHITEKTURY.md` §5 po wdrożeniu zmian
i po sprawdzeniu, co naprawdę mówią liczby.

---

## 1. Co się zmieniło od tamtego planu

Wszystko z tygodnia 1 jest na produkcji: kreator na pięć kroków, prawdziwe liczniki, pomiar
konwersji na `/zapisy`, odzyskany formularz B2B, jeden regulamin. Lejek działa i mierzy.

Ale przy okazji naprawy liczników zobaczyłam liczby, których wcześniej nie było widać —
i one zmieniają nie tempo prac, tylko **kierunek**.

---

## 2. Reinterpretacja: grupy to premiera, nie pusta półka

| Liczba | Wartość |
|---|---:|
| Aktywni uczniowie | 52 |
| Z nich uczących się 1:1 | **52 (wszyscy)** |
| Przyszłe lekcje indywidualne | 393 |
| **Przyszłe lekcje grupowe** | **0** |
| Grupy utworzone w bazie | 2026-07-18 |
| Zapisani do grup | 3 |

Szkoła żyje z lekcji indywidualnych. **Grupy powstały trzy tygodnie temu i jeszcze nie
wystartowały.** „3 osoby na 104 miejsca" to nie jest objaw choroby — to trzeci tydzień premiery
nowej linii produktowej.

To ważne, bo zmienia pytanie. Nie brzmi ono „jak ratować puste grupy", tylko
**„jak wprowadzić na rynek nowy produkt w cztery tygodnie"**. A na to odpowiedź jest inna.

---

## 3. Cztery rzeczy, które zmieniają strategię

### 3.1. Największym ryzykiem jest rozproszenie, nie brak ruchu

Trzynaście grup po osiem miejsc. Grupa z dwiema osobami nie ruszy albo ruszy nierentownie.

Rozłóżmy dowolną liczbę zapisów na trzynaście grup, a dostaniemy trzynaście grup po dwie–trzy
osoby — czyli **trzynaście grup do odwołania**, zwroty, rozczarowani rodzice i spalona
reputacja przed drugim sezonem. Ta sama liczba zapisów skoncentrowana na pięciu grupach daje
pięć grup, które faktycznie ruszają.

I tu jest sedno: **oferta jest przesegmentowana jak na premierę.** Trzynaście grup obsługuje
w praktyce sześć przedziałów wiekowych:

| Przedział | Grupy | Uwaga |
|---|---|---|
| 2–5 lat | Little Explorers | jedyna |
| 6–9 lat | Big Action Games, Crafty English | **dwie** |
| 9–12 lat | Gaming Station, Science Explorers | **dwie** |
| 10–15 lat | AI Creative Lab, Video Podcast Studio | **dwie** |
| 12–17 lat | Teenpreneurs, Teenage Talk | **dwie** |
| 18+ | Angielski od podstaw, Wiecznie Początkujący ·&nbsp;stacjonarnie, Advanced Conversation Club | **trzy** + 1 online |

Dwie grupy dla tego samego wieku w pierwszym sezonie nie dają klientowi wyboru — dzielą popyt
na pół i sprawiają, że żadna nie osiąga progu.

**Rekomendacja: promować jedną grupę na przedział wiekowy, resztę trzymać jako przelew.**
Komunikat brzmi wtedy uczciwie: „Gaming Station, wtorki 16:30 — gdy się zapełni, otwieramy
drugi termin". To działa też jako dowód popytu.

Propozycja wyboru (do Twojej decyzji — to wiedza o rynku, nie o kodzie):

| Przedział | Promujemy | Dlaczego |
|---|---|---|
| 2–5 | Little Explorers | jedyna |
| 6–9 | Big Action Games | ruch i gry to mocniejszy haczyk niż prace plastyczne |
| 9–12 | Gaming Station | najsilniejszy haczyk w tym wieku |
| 10–15 | AI Creative Lab | najbardziej „na czasie", rodzice szukają tego hasła |
| 13–17 | Teenage Talk | Teenpreneurs to węższa nisza |
| 18+ | Wiecznie Początkujący ·&nbsp;stacjonarnie | największy rynek: „uczyłem się latami i nadal nie mówię" |

**Pytanie, na które muszę znać odpowiedź, zanim cokolwiek doradzę dalej: ile osób musi być
w grupie, żeby ruszyła?** Cztery? Pięć? To jedna liczba, która ustawia całą kampanię.

### 3.2. Najtańszy kanał jest kompletnie nieużywany

- **52 aktywne rodziny**, wszystkie z adresem e-mail w bazie.
- **142 uczniów ma wygenerowany kod polecenia.**
- **Zrealizowanych poleceń: 0.** System poleceń (50 zł dla polecającego, 50 zł dla nowego)
  działa i nikt go nigdy nie użył.
- Aktywnych kodów rabatowych: 0.

Rodzic, który już płaci za lekcje 1:1, jest najcieplejszym możliwym leadem na grupę — zna
szkołę, ufa nauczycielom, a grupa jest dla niego tańszym uzupełnieniem, nie ryzykiem. Jeden mail
do 52 osób kosztuje zero i ma konwersję nieporównywalną z reklamą do zimnej publiczności.

Narzędzie już istnieje (`/admin/komunikacja`, wysyłka do wszystkich uczniów).

**To jest pierwsza rzecz do zrobienia — przed jakąkolwiek złotówką na reklamę.**

### 3.3. SEO nie dowiezie uczniów do września

To korekta mojego wcześniejszego uzasadnienia. Nowe strony grup nie zaindeksują się i nie
wypozycjonują w cztery tygodnie — organiczny zysk przyjdzie na styczeń i wrzesień 2027.

Ale strony grup nadal są warte zrobienia **teraz**, tylko z innego powodu:

1. **Strona docelowa pod reklamę.** Reklama „angielski przez gry dla dzieci 9–12" prowadząca
   na stronę Gaming Station z dniem, godziną, ceną i przyciskiem konwertuje wielokrotnie lepiej
   niż ta sama reklama prowadząca na ogólny kreator.
2. **Link do wysłania.** Mail do 52 rodzin, post na Facebooku, wiadomość na WhatsAppie —
   wszystkie potrzebują adresu, który da się wkleić.

Czyli: budujemy je pod konwersję, nie pod pozycjonowanie. Meta dane i schemat `Course`
dokładamy przy okazji, bo to piętnaście minut i procentuje później.

### 3.4. Uczciwa pilność zamiast fałszywej

„Zostały 3 miejsca" nie jest prawdą, gdy wolnych jest osiem — a teraz, gdy licznik działa,
byłoby to kłamstwo widoczne na stronie.

Prawdziwe bodźce, które mamy:

- **Termin zapisów.** „Składy grup ustalamy 25 sierpnia" — konkretna data, prawdziwa,
  tworzy realny powód, żeby nie odkładać.
- **Data startu.** 1 września, widoczna wszędzie.
- **Rozmiar grupy.** „Maksymalnie 8 osób" — mówi o jakości, nie o niedoborze.
- **Licznik, gdy zacznie mieć sens.** Teraz działa i pokaże prawdę, kiedy grupa faktycznie
  zacznie się zapełniać.

---

## 4. Dziury, które trzeba domknąć, zanim ruszy ruch

### 4.1. Zapisany uczeń nie zobaczy żadnych zajęć

**W kalendarzu nie ma ani jednej przyszłej lekcji grupowej.** Nic w systemie nie generuje lekcji
dla grupy — `public_enroll_group` dopisuje do `group_members` i na tym kończy.

Skutek: mail potwierdzający obiecuje „pierwsze zajęcia 1 września", a panel ucznia jest pusty.
Zaufanie pęka dokładnie w momencie, w którym właśnie je zdobyliśmy — i to jest moment, w którym
ludzie proszą o zwrot.

To trzeba naprawić **przed** kampanią, nie po.

### 4.2. Brak oferty online dla dzieci

Jedyna grupa online jest dla dorosłych (A1–A2). Reklama celująca w „angielski online dla dzieci"
trafi w pustkę — kreator obsłuży to elegancko (ścieżka doradcza), ale zapłacimy za kliknięcie,
które nie ma czego sprzedać.

Do decyzji: albo nie reklamujemy online dla dzieci, albo otwieramy jedną grupę online.

### 4.3. Nie wiemy, ile lat mają nasi uczniowie

Wszystkie 52 aktywne rekordy mają `age = NULL`. Nie da się wysłać maila „mamy grupę dla
ośmiolatków" do rodziców ośmiolatków — trzeba wysłać przegląd wszystkich grup i pozwolić
wybrać. Do naprawy przy okazji, nie blokuje.

---

## 5. Zrewidowana kolejność

Ułożona według liczby uczniów na jednostkę pracy, nie według logicznego porządku.

### Teraz (dni 1–3)
1. **Wygenerować lekcje dla grup** (§4.1). Bez tego każdy zapis kończy się pustym panelem.
2. **Decyzja: które grupy promujemy i jaki jest próg uruchomienia** (§3.1). Twoja, nie moja.
3. **Mail do 52 rodzin** z przeglądem grup i terminem zapisów (§3.2). Koszt zero.

### Dni 4–8
4. **Strony grup** pod `/zajecia/<slug>` — jako strony docelowe pod reklamy i linki do wysłania.
   Priorytet: najpierw sześć promowanych, reszta potem.
5. **Termin zapisów i data startu** widoczne w kreatorze, na stronach grup i w mailu.
6. **Cena widoczna poza kreatorem** — 250 zł stacjonarnie, 199 zł online.

### Dni 9–14
7. **Uruchomienie poleceń** — 142 kody istnieją, zero użyć. Jedna wzmianka w mailu i na stronie
   grupy może dać zapisy taniej niż jakakolwiek reklama.
8. **Reklamy** — dopiero teraz, gdy jest gdzie kierować ruch i co obiecywać.
9. **Dowód społeczny** przy decyzji (opinia na stronie grupy i w kroku potwierdzenia).

### Dni 15+
10. Spójny Navbar i stopka na `/zapisy`.
11. Degradacja przy niekompletnych profilach nauczycieli (3 bez zdjęcia, 5 bez bio).
12. Treść obalająca obawy wpleciona w kreator.
13. Mobile i czas ładowania.

**Co się przesunęło i dlaczego:** spójność nawigacji spadła z tygodnia 2 na koniec. Jest ważna
dla zaufania, ale nikt nie rezygnuje z zapisu dlatego, że menu wygląda inaczej — a rezygnuje,
gdy po zapisie widzi pusty panel albo gdy reklama prowadzi w ogólny kreator zamiast na konkretną
ofertę.

---

## 6. Decyzje, których potrzebuję

1. **Próg uruchomienia grupy** — ile osób minimum? Ustawia całą kampanię.
2. **Które grupy promujemy** — moja propozycja w §3.1, ale to Twoja wiedza o rynku.
3. **Termin zapisów** — proponuję 25 sierpnia. Data ma być prawdziwa, bo będzie wszędzie.
4. **Online dla dzieci** — otwieramy grupę czy nie reklamujemy tego kierunku?
5. **Budżet i kanał reklamy** — Meta czy Google? Od tego zależy, jak budować strony docelowe.

---

## 7. Czego świadomie nie proponuję

**Płatności online przy zapisie** — poza zakresem z Twojej decyzji, i słusznie: przy modelu
abonamentowym karta w momencie rezerwacji dokłada tarcia tam, gdzie tracimy najwięcej.

**Rozbudowy SEO ponad to, co jest** — w tym oknie czasowym to praca na przyszły sezon. Warto,
ale nie kosztem punktów 1–8.

**Dnia otwartego, webinaru ani innych działań poza stroną** — bo to nie moja działka, ale
zaznaczam: dla szkoły pod Poznaniem, cztery tygodnie przed startem, dzień otwarty w drugiej
połowie sierpnia jest prawdopodobnie skuteczniejszy niż połowa tego, co jest wyżej. Strona
powinna go wtedy obsłużyć — to jedna sekcja i jeden formularz.
