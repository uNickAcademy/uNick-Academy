# uNick Academy — e-maile uwierzytelniające

Reset hasła, aktywacja konta i linki logowania są wysyłane przez podpisany Supabase Send Email Hook do endpointu aplikacji. Dzięki temu wiadomości są po polsku, mają markę uNick Academy, używają imienia odbiorcy i nie zależą od ograniczonego domyślnego SMTP Supabase.

## Architektura

1. Supabase podpisuje żądanie zgodnie ze Standard Webhooks.
2. `POST /api/auth/send-email-hook` weryfikuje podpis i dane.
3. Aplikacja buduje polską wiadomość i wysyła ją przez Resend z adresu `uNick Academy <hello@unick-academy.pl>`.
4. Link prowadzi do `/auth/confirm`, który bezpiecznie potwierdza jednorazowy token i przekierowuje do `/reset-haslo`.

Webhook obsługuje wszystkie aktualne rodzaje wiadomości Auth, nie tylko reset hasła. Błędy Resend nie są wyciszane: endpoint zwraca `503`, aby Supabase mógł ponowić wysyłkę.

## Konfiguracja produkcyjna

### Vercel

W środowisku Production muszą istnieć:

- `RESEND_API_KEY` — aktywny klucz Resend dla zweryfikowanej domeny `unick-academy.pl`;
- `NEXT_PUBLIC_APP_URL=https://unick-academy.pl`;
- `SEND_EMAIL_HOOK_SECRET` — pełny sekret wygenerowany przez Supabase, w formacie `v1,whsec_...`.

Można użyć `SEND_EMAIL_HOOK_SECRETS` z kilkoma sekretami rozdzielonymi `|` podczas bezpiecznej rotacji.

### Supabase

Projekt `xkydfgunafxfuzsggmca`:

1. **Authentication → URL Configuration**:
   - Site URL: `https://unick-academy.pl`
   - Redirect URLs: `https://unick-academy.pl/**`
2. **Authentication → Hooks → Send Email**:
   - typ: HTTP;
   - URL: `https://unick-academy.pl/api/auth/send-email-hook`;
   - wygeneruj sekret i zapisz ten sam pełny sekret w Vercel jako `SEND_EMAIL_HOOK_SECRET`;
   - włącz hook dopiero po zakończonym wdrożeniu Vercel.

Sekretu nie zapisujemy w repozytorium ani dokumentacji.

## Test po wdrożeniu

1. Otwórz `https://unick-academy.pl/zapomniane-haslo`.
2. Podaj adres istniejącego konta.
3. Sprawdź nadawcę, polski temat, imię i logo.
4. Kliknij „Ustawiam nowe hasło”; adres ma zaczynać się od `https://unick-academy.pl/auth/confirm` i zakończyć formularzem nowego hasła.
5. Ustaw hasło i zaloguj się nim ponownie.

Przy problemie sprawdź kolejno logi funkcji Vercel, logi Resend i Supabase Auth Logs. Nie loguj tokenów ani pełnego payloadu webhooka.
