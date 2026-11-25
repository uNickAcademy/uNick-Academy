# Black Friday 2026 — public preview

Purpose: review the approved voucher design on the existing school domain.

- `/voucher`, `/voucher/potwierdzenie`, `/voucher/email`: standalone browser-only preview served by a Next.js route handler. Only these three paths are allowed; the preview HTML is explicitly included in function tracing.
- `public/voucher-preview/`: scoped styles, local fonts, exact official logo, supplied campaign poster and generated background with uNickorn's shield. Greeting uses “Cześć Anna.” without a comma.
- Polish homepage: native modal dialog, keyboard dismissal/focus containment, once per tab session, hidden automatically after 30 November 2026 (Europe/Warsaw). `?voucher-preview=1` reopens it for review.
- No checkout API, outbound emails, real codes, customer record writes or ActiveNow accounting operations. Form data lives only in current browser memory. All generated codes begin with `DEMO-UNICK-`; downloaded graphics say the code is inactive. Pages are noindex.

Checks: production build and browser review of popup, responsive form, simulated checkout, greeting and voucher download. Payment and email remain simulations.

Before real sales: replace the demo submit action with server-created PayU orders; validate signed payment notifications and totals server-side; issue each code once after payment confirmation; store actual cash and bonus separately; generate/send the voucher on the server; implement controlled code activation in ActiveNow with an audit trail. Add final purchase/privacy information. A browser return from PayU must never issue value by itself.
