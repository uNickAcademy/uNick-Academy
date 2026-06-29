# uNick Academy — Konfiguracja e-maili (Resend + Supabase Auth)

Po wykonaniu tych kroków będą działać: **powiadomienia z aplikacji** (potwierdzenia rezerwacji, przypomnienia) oraz **reset hasła / linki logowania** dla rodziców.

Stan obecny: klucz `RESEND_API_KEY` w projekcie to placeholder → żadne e-maile realnie nie wychodzą. Trzeba podać prawdziwy klucz i skonfigurować SMTP w Supabase.

---

## Krok 1 — Resend: konto + weryfikacja domeny (DNS)
1. Załóż/zaloguj konto na **resend.com**.
2. **Domains → Add Domain** → wpisz `unick-academy.pl`.
3. Resend pokaże rekordy DNS (zwykle **MX** + **TXT/SPF**, **DKIM**, opcjonalnie **DMARC**). Dodaj je u rejestratora domeny / w DNS (tam gdzie masz rekordy A/CNAME dla Vercela).
4. Poczekaj na status **Verified** (kilka–kilkadziesiąt minut).
5. **API Keys → Create API Key** (uprawnienie *Sending*). Skopiuj klucz `re_...` — pokazywany tylko raz.

## Krok 2 — Wstaw prawdziwy klucz Resend do aplikacji
1. Lokalnie w `.env.local` ustaw `RESEND_API_KEY=re_twój_klucz`.
2. W Vercel: **Project u-nick-academy → Settings → Environment Variables** → ustaw `RESEND_API_KEY` (scope **Production**) na ten sam klucz (nadpisz placeholder).
   - lub z terminala (w katalogu projektu): `printf '%s' 're_twój_klucz' | npx vercel env add RESEND_API_KEY production --force`
3. **Redeploy**: `npx vercel --prod`.
4. Sprawdź adres nadawcy w kodzie wysyłki (`src/lib/email/send.ts`) — musi być z **zweryfikowanej domeny**, np. `no-reply@unick-academy.pl`. (Mogę to ustawić.)

## Krok 3 — Supabase: Auth URL Configuration
Panel Supabase → projekt `xkydfgunafxfuzsggmca` → **Authentication → URL Configuration**:
- **Site URL:** `https://unick-academy.pl`
- **Redirect URLs:** dodaj `https://unick-academy.pl/**`

Bez tego linki w mailach (reset hasła) prowadziłyby pod zły adres.

## Krok 4 — Supabase: własny SMTP przez Resend
Panel Supabase → **Authentication → Emails → SMTP Settings** → **Enable Custom SMTP**:
- **Host:** `smtp.resend.com`
- **Port:** `465` (SSL) lub `587` (STARTTLS)
- **Username:** `resend`
- **Password:** Twój klucz **`re_...`** (ten sam co w Resend)
- **Sender email:** `no-reply@unick-academy.pl` (z zweryfikowanej domeny)
- **Sender name:** `uNick Academy`

Zapisz. Domyślny SMTP Supabase wysyła tylko do członków projektu i ma ostre limity — własny SMTP odblokowuje wysyłkę do wszystkich rodziców.

## Krok 5 — (opcjonalnie) limity i szablony
- **Authentication → Rate Limits** — podnieś limit e-maili, jeśli planujesz dużo resetów naraz.
- **Authentication → Emails → Templates** — spolszcz treści (reset hasła, zaproszenie, magic link).

## Krok 6 — Test
1. Na `unick-academy.pl/login` → „Zapomniałem/am hasła" → podaj swój e-mail.
2. Sprawdź, czy mail dotarł (i w Resend → **Logs** czy wysyłka = *delivered*).

---

### Uwagi
- Do czasu pełnej konfiguracji rodzice i tak mają dostęp: konta z zapisów online dostają **hasło startowe `!uNickStart2026`** (pokazywane po zapisie), które zmieniają po zalogowaniu.
- Te same dane SMTP (Resend) obsługują równolegle maile aplikacyjne i maile Auth — wystarczy jeden klucz.
