# Teenpreneurs — sub-site handbook

The Teenpreneurs site lives inside this repo under `/teenpreneurs` and runs on its
**own** infrastructure (Unick Academy International), separate from the school:

| Concern  | Teenpreneurs | School (unchanged) |
|---|---|---|
| Supabase | `teenpreneurs-website` project (`dtbeumqzgpsjtpbixmcn`) | `xkydfgunafxfuzsggmca` |
| Stripe   | own account, `TP_STRIPE_*` keys | `STRIPE_*` keys |
| Email    | Resend, sender `hello@teenpreneur.academy` | Resend, `hello@unick-academy.pl` |
| Webhook  | `/api/teenpreneurs/stripe/webhook` | `/api/stripe/webhook` |

## URLs

- English: `/teenpreneurs/en` · Polish: `/teenpreneurs/pl` (`/teenpreneurs` redirects by cookie)
- Pages: `/program`, `/differentability`, `/parents`, `/event`, `/shop`,
  `/shop/teenpreneur-journal`, `/shop/shameless-benevolence`, `/shop/cart`,
  `/enrol`, `/downloads`, `/contact`, `/privacy`, `/terms`, `/refunds`
- When the `teenpreneur.academy` domain is added to this Vercel project, the
  middleware already rewrites it onto the sub-site (root of the domain = TP home).

## Environment variables to set in Vercel (Production + Preview)

| Variable | Where to get it |
|---|---|
| `TP_SUPABASE_URL` | `https://dtbeumqzgpsjtpbixmcn.supabase.co` |
| `TP_SUPABASE_SERVICE_ROLE_KEY` | Supabase → teenpreneurs-website → Settings → API (**secret**) |
| `TP_STRIPE_SECRET_KEY` | Stripe (Unick Academy International account) → Developers → API keys |
| `TP_STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → add endpoint `https://<domain>/api/teenpreneurs/stripe/webhook`, event `checkout.session.completed` |
| `TP_RESEND_API_KEY` *(optional)* | Own Resend account for the international entity; falls back to `RESEND_API_KEY` |
| `TP_EMAIL_FROM` *(optional)* | Defaults to `Teenpreneurs <hello@teenpreneur.academy>` — the domain must be verified in Resend first |

Until the `TP_*` keys are set, the site renders fully; only checkout/enrol/forms
answer "momentarily offline". Nothing on the school side is affected.

## Where things are configured (no layout files involved)

- **Prices, products, variants, shipping countries** → `src/lib/teenpreneurs/products.ts`
  (fixed prices per currency: PLN + EUR; add `usd` to `TpCurrency` + each price map for Cycle 2)
- **Founding/standard enrolment price, offer deadline, age tracks, time slots** → same file (`TP_ENROLMENT`)
- **All copy, FAQ entries, legal text, email text** → `src/lib/teenpreneurs/i18n/en.ts` + `pl.ts`
  (add `es`/`de`/`uk` by copying `pl.ts` and registering the locale in `i18n/index.ts`)
- **Brand tokens** → `tailwind.config.js` (`tp.*` colours, `font-tp-display`, `font-tp-editorial`)
- **Analytics + Meta pixel slot** → `src/components/teenpreneurs/TpAnalytics.tsx`
- **DB schema (already applied)** → `supabase/teenpreneurs/001_tp_commerce_schema.sql`

## How the shop fulfils orders

1. Cart (localStorage) → `POST /api/teenpreneurs/checkout` → Stripe Checkout
   (automatic tax on; shipping address collected only if a physical item is in the cart).
2. **Stripe webhook** (`checkout.session.completed`) is the only fulfilment trigger:
   writes `tp_orders` + `tp_order_items` (idempotent on session id), mints 72-hour /
   5-use download tokens for digital items, emails confirmation + links via Resend.
   The success page never delivers files.
3. Digital files live in the **private** `tp-downloads` bucket; a token click issues a
   5-minute signed URL. Expired links → `/teenpreneurs/<locale>/downloads` re-issues by email.
4. Physical orders get `fulfilment_status='pending'` — see them in Supabase Table Editor
   (`tp_orders`), mark `shipped` + `shipped_at` when posted.

## Still needed from you (launch checklist)

1. **Confirm prices** in `products.ts` — journal print/digital and book are PLACEHOLDERS;
   founding 1 490 zł / €349 and standard 2 190 zł / €499 are set (standard was my placeholder — confirm).
2. **Upload the two PDFs** to the `tp-downloads` bucket at
   `journal/teenpreneur-journal.pdf` and `shameless/shameless-benevolence.pdf`.
3. **Product photos** (journal), **cover art** (book), **founder video** (Home + Differentability
   slots are clearly marked), testimonials after the first Showcase Day.
4. **Set the six `TP_*` env vars** in Vercel and create the Stripe webhook endpoint.
5. **Legal placeholders**: registered address, KRS/NIP, policy dates in `en.ts`/`pl.ts`;
   confirm Antoś's pull-quote wording.
6. **Verify `teenpreneur.academy`** in Resend; add the domain in Vercel when ready.
7. **Import old waitlist rows** into `waitlist_signups` (table already reused by
   `POST /api/teenpreneurs/waitlist`).
8. Drop analytics + Meta pixel snippets into `TpAnalytics.tsx` before running ads.
