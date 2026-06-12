# uNick Academy

Platforma do zarządzania szkołą językową — Next.js 15 (App Router) + Supabase + Tailwind CSS.

## Panele i role
- **Administrator** – pełny dostęp (uczniowie, grupy, kalendarz, cennik, płatności, raporty, komunikacja, firmy B2B, pipeline).
- **Recepcja** – dostęp operacyjny (bez konfiguracji).
- **Prowadzący** (`/nauczyciel`) – e-dziennik, dostępność, uczniowie, przekładanie/odwoływanie, zastępstwa.
- **Klient / Rodzic** (`/dashboard`) – lekcje, odrabianie, płatności, profil; dwujęzyczny PL/EN.
- **HR / B2B** (`/firma`) – frekwencja, płatności i faktury pracowników firmy.

## Wymagania
- Node.js 18+
- Konto Supabase (projekt: `xkydfgunafxfuzsggmca`)

## Uruchomienie lokalne
```bash
npm install
# utwórz .env.local i uzupełnij wartości (patrz tabela niżej)
npm run dev   # http://localhost:3000
```

## Zmienne środowiskowe (`.env.local`)
| Zmienna | Opis |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projektu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | klucz publiczny (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | **tajny** klucz service_role (operacje serwerowe, zapisy) |
| `RESEND_API_KEY` | wysyłka e-maili (Resend) |
| `CRON_SECRET` | zabezpieczenie endpointu cron przypomnień |
| `NEXT_PUBLIC_APP_URL` | `https://unick-academy.pl` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | płatności (opcjonalne – do włączenia później) |

## Wdrożenie (Vercel + domena unick-academy.pl)
1. **GitHub:** wypchnij repo (`git push`). `.env.local` jest w `.gitignore` — sekrety nie trafiają do repo.
2. **Vercel:** [vercel.com/new](https://vercel.com/new) → Import repo → Deploy (framework Next.js wykrywany automatycznie; `vercel.json` dodaje godzinny cron przypomnień).
3. **Zmienne środowiskowe** w Vercel → Settings → Environment Variables (scope: Production) — skopiuj z `.env.local`, ustaw `NEXT_PUBLIC_APP_URL=https://unick-academy.pl`, potem **Redeploy**.
4. **Domena:** Vercel → Settings → Domains → dodaj `unick-academy.pl` i `www.unick-academy.pl`. U rejestratora ustaw rekordy DNS pokazane przez Vercel:
   - `A` `@` → `76.76.21.21`
   - `CNAME` `www` → `cname.vercel-dns.com`
5. **Supabase Auth** → URL Configuration: Site URL `https://unick-academy.pl`, Redirect URLs `https://unick-academy.pl/**`.
6. **Stripe (gdy włączasz płatności):** webhook `https://unick-academy.pl/api/stripe/webhook`, zdarzenia `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`; sekret → `STRIPE_WEBHOOK_SECRET`.

## Konta startowe (zmień hasła po wdrożeniu!)
- Admin: `admin@unick-academy.pl` / `UNickAdmin2026!`
- Recepcja: `recepcja@unick-academy.pl` / `UNickRecepcja2026!`
- Prowadzący: np. `nick@unick-academy.pl` / `UNickTemp2026!`

## Integracje „gotowe-nieaktywne" (do włączenia kluczami)
Stripe (płatności live), faktury PDF + Fakturownia/wFirma, SMS, Brevo (marketing), push (VAPID), piksele konwersji Google/Facebook.

## Skrypty
```bash
npm run dev     # serwer deweloperski
npm run build   # build produkcyjny (strict TypeScript)
npm run start   # serwer produkcyjny
npm run lint    # ESLint (ręcznie; wyłączony w buildzie – false-positive react-hooks/purity w Server Components)
```
