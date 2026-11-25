# Vouchery Black Friday 2026

## Cel i stan
Docelowa witryna `/voucher` zastępuje publiczny mock. Oferta 250/239, 500/449,
1000/849, 5000/3999 zł; podpisy kart „zł zniżki”. Zakup dla siebie lub na prezent,
opcjonalne dane fakturowe, bez konta odbiorcy. Puste miejsce na imię w PNG.

Sprzedaż pozostaje zablokowana (`VOUCHER_SALES_ENABLED=false`). Konto PayU w
ActiveNow jest aktywne, ale strona nie ma jeszcze kluczy REST PayU. Użytkowniczka
przekazała komunikat o awarii panelu PayU 25.11.2026. Nie wykonano płatności ani
rzeczywistej wysyłki vouchera. Nie należy opisywać integracji jako uruchomionej.

## Architektura
- `src/lib/vouchers`: konfiguracja oferty w groszach, walidacja, PayU, podpisy,
  rendering PNG i dostarczenie przez Resend. Wspólna grafika z podglądem.
- `/api/vouchers/checkout`: okno dat + flaga + kompletna konfiguracja, walidacja,
  ograniczenie prób, idempotency key, serwerowa cena, zamówienie PayU.
- `/api/vouchers/payu/notify`: podpis MD5 surowego body zgodny z PayU; kontrola
  POS, PLN, ceny i numeru zamówienia. Dopiero `COMPLETED` wydaje kod w transakcji.
- Kod z bezpiecznego generatora; 12 miesięcy od opłacenia w Europe/Warsaw.
  Powtórna notyfikacja nie wydaje kolejnego kodu ani drugiego uznania.
- `voucher_ledger`: osobno rzeczywista wpłata oraz bonus/zniżka. Przykład:
  84900 gr cash + 15100 gr bonus = 100000 gr wartości; nie 100000 gr cash.
- E-mail: PNG inline (CID), kod, pusty odbiorca, warunki w trwałym załączniku TXT.
  Pomyślna odpowiedź dostawcy jest zapisywana. Błąd daje PayU 503 do ponowienia;
  równoczesne próby dostarczenia są blokowane; wysyłka ma klucz idempotencji.
- Potwierdzenie i pobranie używają prywatnego tokenu w fragmencie adresu oraz
  nagłówku Authorization do API. Brak PII i kodu w publicznym query string.
- Brak zmian w istniejących tabelach finansowych i saldach ActiveNow. Nowe
  tabele mają RLS, bez uprawnień anon/authenticated; RPC wyłącznie service_role.

## Obsługa szkoły
`/admin/vouchery` (admin/reception): wpłata, zniżka, stan PayU, e-mail, dane do
faktury, kod i aktywacja. Faktury nie są automatycznie wystawiane; to osobny
proces szkoły. Widok obejmuje 100 ostatnich zamówień.

Aktywacja: odbiorca kontaktuje się ze szkołą z kodem. Operator rezerwuje voucher
w rejestrze PRZED zmianami w ActiveNow. Druga osoba nie może przejąć tej aktywacji.
Po sprawdzeniu właściwego odbiorcy i uzgodnionego modelu ewidencji operator
wykonuje operacje w ActiveNow, a następnie zapisuje ID odbiorcy i referencje obu
operacji. Nie wolno oznaczać 1000 zł jako faktycznej wpłaty, gdy wpłata wyniosła
849 zł. Sposób technicznego przyznania salda w ActiveNow nadal wymaga testu i
uzgodnienia księgowego. Sam kod nie jest kodem rabatowym ActiveNow.

Rezerwacje nie wygasają automatycznie. Można je zwolnić dopiero po potwierdzeniu,
że w ActiveNow nie wykonano żadnych operacji lub wszystkie zostały cofnięte.
Zapis pełnego zwrotu unieważnia kod i dodaje oddzielne ujemne wpisy cash/bonus;
nie wykonuje przelewu PayU. Dla aktywowanego vouchera wymaga referencji korekt
ActiveNow. Zwrotów częściowych nie obsługuje ten przycisk — należy uzgodnić je
indywidualnie i nie używać przycisku pełnego zwrotu.

## Warunki przed odblokowaniem płatności
1. Po przywróceniu panelu PayU uzyskać klucze REST właściwego POS, zweryfikować
   sprzedawcę, walutę PLN, dostępne BLIK/karty i tryb automatycznego odbioru.
2. Ustawić cztery PAYU_* w produkcyjnym Vercel, bez ujawniania wartości.
3. Przejść checkout do strony PayU bez rzeczywistej płatności. Pełne potwierdzenie
   dostarczenia sprawdzić w środowisku testowym lub osobno uzgodnionym teście.
4. Zweryfikować model aktywacji wartości w ActiveNow na odrębnym koncie testowym,
   z oddzieleniem części opłaconej i zniżki; sprawdzić fakturowanie/ujęcie bonu.
5. Dopiero po spełnieniu powyższego zmienić flagę na true i wdrożyć. Serwer
   niezależnie pilnuje 27–30 listopada, więc sama flaga nie otwiera zakupu wcześniej.

Stare testowe wydarzenia i formularze ActiveNow pozostają wyłączone; nie należy
równocześnie uruchamiać dwóch ścieżek sprzedaży. 50 niewydanych kodów z arkusza
nie jest używane przez generator i nie wolno ich wysyłać bez potwierdzonej wpłaty.

## Weryfikacja
`node tests/vouchers.cjs`: kwoty, daty, walidacja, HMAC, modyfikacja webhooka,
kody, generowanie przenośnego PNG z polskimi znakami i brak grafiki przed wpłatą.
`tests/vouchers-database.sql`: transakcyjne testy rezerwacji, podwójnej aktywacji,
zwrotu i odtworzenia nieprawidłowo starego statusu — wszystkie dane ROLLBACK.
Sprawdzono także podwójny COMPLETED: jeden kod, dwa wpisy cash/bonus, jedna
rezerwacja e-maila. Po testach brak zamówień i wpisów finansowych testowych.
Browser: telefon, cztery etykiety zniżek, faktura, stan przed startem, regulamin.

## Rozszerzenia
API ActiveNow tylko po potwierdzeniu obsługi operacji finansowych. Wtedy można
zastąpić ręczną aktywację adapterem z idempotencją i pełnym audytem. Nie stosować
klikacza panelu do automatycznych rozliczeń klientów. Przy kolejnej promocji
wydzielić kampanie zamiast zmieniać historyczne ceny lub wersję regulaminu.
