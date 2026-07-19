import Stripe from 'stripe'

// Leniwa inicjalizacja — klient powstaje dopiero przy użyciu, gdy jest klucz.
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  return key
    ? new Stripe(key, { apiVersion: '2025-01-27.acacia' as Stripe.StripeConfig['apiVersion'] })
    : null
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

// Tworzy sesję Stripe Checkout na jednorazową płatność (BLIK / Przelewy24 / karta).
// Zwraca URL do przekierowania lub null, gdy Stripe nie jest skonfigurowany.
export async function createCheckoutSession(opts: {
  amount: number
  studentId: string
  description: string
  successUrl?: string
  cancelUrl?: string
  email?: string
}): Promise<string | null> {
  const stripe = getStripe()
  if (!stripe) return null
  const value = Math.round(Number(opts.amount))
  if (!Number.isFinite(value) || value < 1 || value > 50_000) return null
  const base = process.env.NEXT_PUBLIC_APP_URL || ''
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'p24', 'blik'],
    line_items: [{
      price_data: {
        currency: 'pln',
        product_data: { name: opts.description || 'uNick Academy' },
        unit_amount: value * 100,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: opts.successUrl || `${base}/platnosci?success=true`,
    cancel_url: opts.cancelUrl || `${base}/platnosci?cancelled=true`,
    metadata: { studentId: opts.studentId },
    customer_email: opts.email || undefined,
    locale: 'pl',
  })
  return session.url
}
