import Stripe from 'stripe'

// Teenpreneurs uses its own Stripe account (Unick Academy International),
// separate from the school's. Lazy init: no key → routes answer 503.
export function getTpStripe(): Stripe | null {
  const key = process.env.TP_STRIPE_SECRET_KEY
  return key
    ? new Stripe(key, { apiVersion: '2025-01-27.acacia' as Stripe.StripeConfig['apiVersion'] })
    : null
}
