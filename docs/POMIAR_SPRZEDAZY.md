# Pomiar sprzedaży — jak działa i co trzeba włączyć

Dokument opisuje warstwę pomiarową: skąd wiemy, z której reklamy przyszedł
uczeń, i gdzie ta informacja ląduje.

## Co trzeba zrobić ręcznie (poza kodem)

1. **Meta Pixel** — założyć pixel w Meta Events Manager, skopiować ID (same
   cyfry) i wkleić w Vercel → Project Settings → Environment Variables jako
   `NEXT_PUBLIC_META_PIXEL_ID`, dla środowiska Production. Zmienna wchodzi w
   życie przy następnym wdrożeniu (albo po kliknięciu „Redeploy").

   Dopóki zmiennej nie ma, komponent `MetaPixel` nie ładuje niczego i strona
   działa normalnie — po prostu bez pomiaru Meta. Nie trzeba nic zmieniać w
   kodzie w dniu startu kampanii.

2. **Zdarzenia w Meta Ads** — po pierwszych konwersjach oznaczyć w Events
   Managerze `CompleteRegistration` (zapis do grupy) jako główne zdarzenie
   optymalizacji, a `Lead` jako pomocnicze.

3. **GA4** — zdarzenia niżej trafiają do GA automatycznie, ale żeby liczyły się
   jako konwersje, trzeba je oznaczyć w GA4 → Admin → Events → „Mark as key
   event": `zapisy_wyslane`, `konsultacja_wyslana`, `kontakt_wyslany`,
   `b2b_zapytanie`.

## Skąd bierze się atrybucja

`src/lib/analytics/attribution.ts`

Przy wejściu na **dowolną** stronę publiczną zapisujemy „dotknięcie": `utm_*`,
`gclid`, `fbclid`, `?ref=` (kod polecenia) oraz stronę odsyłającą. Wcześniej
parametry czytaliśmy dopiero na stronie z formularzem, więc typowa ścieżka
„reklama → strona główna → /zapisy" gubiła atrybucję w całości i lead lądował
w lejku jako `(brak kampanii)`.

Zasada: **pierwsze** dotknięcie zapisuje się raz i nigdy nie jest nadpisywane,
**ostatnie** przesuwa się tylko przy nowym, konkretnym źródle. Klikanie po
serwisie nie kasuje kampanii, z której ktoś przyszedł.

Zgoda na cookies:

| gdzie | kiedy | jak długo |
|---|---|---|
| `sessionStorage` | zawsze | jedna wizyta |
| `localStorage` | po zgodzie na cookies analityczne | 90 dni |

Pamięć sesji działa bez zgody, bo służy wyłącznie do opisania zgłoszenia, które
użytkownik sam za chwilę wyśle, i znika po zamknięciu karty. Pamięć
długoterminowa (powroty po kilku dniach) wymaga zgody — tak samo jak GA i Meta
Pixel. Opisane w polityce prywatności.

## Gdzie ląduje wynik

Etykieta kampanii idzie do `leads.campaign` w formacie zgodnym z tym, co już
jest w bazie i w widoku `v_lead_funnel`:

- `facebook:wrzesien_dzieci` — źródło i kampania z `utm_*`
- `google:cpc` — kliknięcie płatne bez otagowania (sam `gclid`)
- `google:organic` — wejście z wyników wyszukiwania
- `polecenie_UNICKANNAR4VW` — kod polecenia

Raport: `select * from v_lead_funnel order by miesiac desc` — konwersje etap po
etapie w rozbiciu na kampanie.

Zapytania B2B mają osobny lejek (`b2b_leads`) bez kolumny na kampanię —
`source` musi zostać stabilną etykietą kanału, po której grupuje się pipeline,
więc szczegół kampanii trafia do `notes` i do maila z powiadomieniem.

## Zdarzenia

| GA4 | Meta | kiedy |
|---|---|---|
| `zapisy_start` | `InitiateCheckout` | wejście do kreatora `/zapisy` |
| `zapisy_krok` | — | ukończenie kroku kreatora |
| `zapisy_wyslane` | `CompleteRegistration` / `Lead` | wysłany zapis (grupa / porada i kurs indywidualny) |
| `konsultacja_wyslana` | `Lead` | modal „Bezpłatna konsultacja" |
| `kontakt_wyslany` | `Lead` | formularz na `/pl/contact` |
| `b2b_zapytanie` | `Lead` | formularz firmowy |

Oba systemy startują dopiero po zgodzie na cookies analityczne, więc przed
zgodą `window.gtag` i `window.fbq` nie istnieją, a każde wywołanie jest cichym
brakiem operacji — nie trzeba tego sprawdzać w miejscach wywołania.
