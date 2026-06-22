import Stripe from 'stripe'

// Lazily construct the Stripe client on first use. Stripe's constructor
// throws synchronously if STRIPE_SECRET_KEY is missing, which would crash
// `next build`'s page-data collection for any route that merely imports
// this module (e.g. when the env var isn't configured for an environment).
let _stripe

export const stripe = new Proxy({}, {
  get(_target, prop) {
    if (!_stripe) {
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20',
      })
    }
    return _stripe[prop]
  },
})

export function createStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}
