# uNick Academy – Instrukcja uruchomienia

## Stack
- **Next.js 16** (App Router) + TypeScript
- **Supabase** – PostgreSQL + autentykacja
- **Stripe** – płatności (BLIK, Przelewy24, karta)
- **Resend** – email automations
- **Tailwind CSS 4**
- **Vercel** – deployment + cron jobs

---

## Krok 1: Instalacja

```bash
cd unick-academy
npm install
```

## Krok 2: Supabase (2 minuty)

1. Wejdź na [supabase.com](https://supabase.com) → **New project**
2. Ustaw nazwę: `unick-academy`, wybierz region: **Central EU (Frankfurt)**
3. W **SQL Editor** wklej i uruchom cały plik `supabase/schema.sql`
4. Skopiuj z **Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

## Krok 3: Resend (5 minut)

1. Wejdź na [resend.com](https://resend.com) → zarejestruj się
2. **API Keys → Create API Key** → skopiuj do `RESEND_API_KEY`
3. **Domains → Add Domain** → dodaj `unick.academy` i skonfiguruj DNS
   - Bez własnej domeny: na początku użyj `onboarding@resend.dev` (zmień `FROM` w `src/lib/email/send.ts`)

## Krok 4: Stripe (10 minut)

1. Utwórz konto na [stripe.com](https://stripe.com)
2. **Settings → Payment Methods** → włącz **BLIK** i **Przelewy24**
3. Skopiuj z **Developers → API Keys**:
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`

## Krok 5: Zmienne środowiskowe

```bash
cp .env.local.example .env.local
```

Uzupełnij wszystkie wartości w `.env.local`.

## Krok 6: Uruchomienie lokalne

```bash
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000)

## Krok 7: Stripe Webhook (lokalnie do testów)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Skopiuj `webhook signing secret` → `STRIPE_WEBHOOK_SECRET` w `.env.local`.

## Krok 8: Deployment na Vercel

```bash
npx vercel
```

Lub: podłącz repo GitHub na [vercel.com](https://vercel.com) i dodaj wszystkie zmienne z `.env.local` w **Settings → Environment Variables**.

Na Vercel dodaj też Stripe webhook endpoint:
- URL: `https://unick.academy/api/stripe/webhook`
- Events: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`

---

## Struktura aplikacji

```
/                       ← Strona główna (uNickorn + wybór ścieżki)
/dla-siebie             ← Landing page prywatny
/dla-firm               ← Landing page B2B
/zapisy                 ← Booking flow 5-krokowy
/login                  ← Logowanie (Supabase Auth)

/dashboard              ← Portal studenta
/lekcje
/postepy
/polecenia
/platnosci
/rozliczenia

/admin/dashboard        ← Panel admina
/admin/studenci
/admin/lekcje
/admin/kalendarz        ← Drag & drop, kolory per nauczyciel
/admin/nauczyciele
/admin/platnosci
/admin/polecenia

/api/booking            ← POST: rezerwacja lekcji + emaile
/api/stripe/webhook     ← Stripe: płatności, zaległości
/api/stripe/checkout    ← Stripe: sesja płatności
/api/cron/reminders     ← Cron: przypomnienia 24h + zaległości (co godz.)
```

## Email automations (gotowe)

| Trigger | Email | Plik |
|---|---|---|
| Nowa rejestracja przez booking | Powitalny z kodem polecenia | `templates.ts` |
| Rezerwacja lekcji | Potwierdzenie z linkiem Meet | `templates.ts` |
| 24h przed lekcją | Przypomnienie | `templates.ts` |
| Zaległość w płatności | Przypomnienie o kwocie | `templates.ts` |
| Znajomy dołączył z kodem | Kredyt +50 zł | `templates.ts` |

## Następne kroki

- [ ] Zdjęcia Milly i Nicka → `public/teachers/milly.jpg`, `nick.jpg`
- [ ] Blog: `/blog` (MDX lub Supabase table)
- [ ] Strona `/nauczyciele` (publiczna)
- [ ] Google Meet API – automatyczne tworzenie linków do lekcji
- [ ] Zastąpić mock data w widokach prawdziwymi zapytaniami z `lib/supabase/queries.ts`
