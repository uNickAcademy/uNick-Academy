# uNick Teachers Academy - setup notes

The Teachers Academy lives under `/academy` in this Next.js app, alongside the
existing tutoring landing page at `/`.

## 1. Supabase

A dedicated Supabase project, **"uNick Teachers Academy"**, was created
(separate from the production tutoring database):

- Project ref: `ohugscpctjdquebvqigb`
- URL: `https://ohugscpctjdquebvqigb.supabase.co`

Schema (see `supabase/migrations/`):

- `profiles` - one row per auth user (created automatically on signup via a
  trigger). Tracks `stripe_customer_id`, `subscription_status`
  (`none`/`active`/`past_due`/`cancelled`), `subscription_currency`,
  `subscription_plan` (`monthly`/`annual`) and `is_admin`.
- `lesson_plans` - `title`, `description`, `cefr_level` (A1-C2), `age_group`
  (`young_learners`/`teens`/`adults`), `skills` (text array), `pdf_path`
  (object path in the `lesson-plans` storage bucket), `is_free`.
- `stripe_webhook_events` - dedupes Stripe webhook deliveries.
- Storage bucket `lesson-plans` (private). RLS mirrors the lesson_plans
  policies: free lessons are downloadable by anyone, paid lessons only by
  users with `subscription_status = 'active'`, and admins can manage all
  files.

A handful of sample lesson plans were seeded (3 free, 3 members-only) so the
homepage/library aren't empty, but their `pdf_path` values (e.g.
`samples/present-simple-a1.pdf`) don't have matching files in storage yet -
upload real PDFs to those rows or add new lesson plans from `/academy/admin`.

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` - already set to the project URL above.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - from Supabase Dashboard -> Project
  Settings -> API -> Project API keys ("anon" / "publishable").
- `SUPABASE_SERVICE_ROLE_KEY` - from the same page ("service_role" /
  "secret"). Server-only, used for webhook updates and signed PDF URLs.

### Making someone an admin

There's no UI for this in v1 (avoids a chicken-and-egg problem). After
someone signs up, run in the Supabase SQL editor:

```sql
update public.profiles set is_admin = true where email = 'nick@example.com';
```

Admins see an "Admin" link in the nav and can add lesson plans at
`/academy/admin/new`.

## 2. Stripe

One product, **"uNick Teachers Academy Membership"**, with monthly and
annual recurring prices in PLN, EUR and USD (see `lib/constants.js` ->
`PRICES` for amounts: ~20 PLN / 5 EUR / 6 USD per month, annual priced at
~10x the monthly rate i.e. 2 months free).

> The brief's monthly amounts (20 PLN / 5 EUR / 6 USD) are treated as
> **VAT-inclusive** for v1 - Stripe automatic tax is not enabled. Annual
> pricing wasn't specified in the brief; the "2 months free" amounts above
> are a placeholder and should be reviewed before launch. Revisit VAT/tax
> settings before going live, as noted in the brief.

### Create the product & prices

```sh
STRIPE_SECRET_KEY=sk_test_... npm run setup:stripe
```

This creates the product and 6 prices (idempotent - safe to re-run) and
prints the price IDs to copy into `.env.local`:

```
STRIPE_PRICE_MONTHLY_USD=...
STRIPE_PRICE_MONTHLY_EUR=...
STRIPE_PRICE_MONTHLY_PLN=...
STRIPE_PRICE_ANNUAL_USD=...
STRIPE_PRICE_ANNUAL_EUR=...
STRIPE_PRICE_ANNUAL_PLN=...
```

### Webhook

Add a webhook endpoint pointing to `/academy/api/stripe/webhook`, subscribed
to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

For local development: `stripe listen --forward-to localhost:3000/academy/api/stripe/webhook`.

## 3. Currency detection

The pricing page guesses the visitor's currency from the
`x-vercel-ip-country` header (PL -> PLN, other EU countries -> EUR, else
USD), with a manual currency switcher. Adjust `currencyForCountry` in
`lib/constants.js` if hosting elsewhere.
