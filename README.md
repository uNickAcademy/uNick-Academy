# uNick-Academy

## Setup

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies migrations
npm run db:seed          # demo students/admin covering every referral status
npm run dev
```

Sign in on `/login` using just an email address (placeholder auth - see
`lib/auth.js`). Demo accounts created by the seed script:

- `admin@unick-academy.pl` - admin panel (`/admin/referrals`)
- `marta@example.com`, `karolina@example.com`, `ewa@example.com`, `klara@example.com` - referrers in different stages
- `piotr@example.com` - new student with a pending 50 PLN bonus

## Referral programme

Implements the uNick Academy referral programme: every student gets a unique
referral code (`/dashboard`); a new student can redeem one during
registration or before their first purchase; both sides get a 50 PLN account
credit once the referred student makes a qualifying purchase (>= 200 PLN, or
a full package/month) and attends 4 lessons without a refund.

B2B/corporate accounts (students belonging to a `Company`, e.g. Democo) are
excluded from the programme entirely - their codes can't be redeemed and they
can't redeem anyone else's.

- **Schema**: `prisma/schema.prisma` - `User`, `Referral`, `CreditTransaction`
  (the credit ledger), `Purchase`, `Lesson`.
- **Business logic & validation**: `lib/referrals.js` - eligibility checks,
  abuse-prevention/flagging, qualification, reward granting, refund
  reversal, and credit redemption rules. Tunable constants live in
  `lib/constants.js`.
- **API routes**: `app/api/referrals/*`, `app/api/purchases`,
  `app/api/lessons`, `app/api/admin/*`.
- **UI**: `/dashboard` (student panel - referral code, programme explanation,
  credits, referral list) and `/admin/referrals` (admin panel - all
  referrals, manual status changes, manual credit adjustments).

`app/api/purchases` and `app/api/lessons` are the integration points a real
payments/booking system should call; the dashboard's "Narzędzia demo" section
calls them directly so the whole flow can be exercised without one.
