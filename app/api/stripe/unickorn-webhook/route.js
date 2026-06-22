import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeClient } from '@/lib/stripe'
import { UNICKORN_STRIPE_PRICES } from '@/lib/unickorn/config'

const STATUS_MAP = {
  trialing: 'trialing',
  active: 'active',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'past_due',
  incomplete: 'none',
  incomplete_expired: 'none',
  paused: 'canceled',
}

function tierFromPriceId(priceId) {
  return Object.entries(UNICKORN_STRIPE_PRICES).find(([, id]) => id === priceId)?.[0] || null
}

export async function POST(request) {
  const stripe = createStripeClient()
  const signature = request.headers.get('stripe-signature')
  const body = await request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  if (!event.type.startsWith('customer.subscription.')) {
    return NextResponse.json({ received: true })
  }

  const subscription = event.data.object
  const status = event.type === 'customer.subscription.deleted'
    ? 'canceled'
    : (STATUS_MAP[subscription.status] || 'none')
  const priceId = subscription.items?.data?.[0]?.price?.id
  const tier = tierFromPriceId(priceId)

  const admin = createAdminClient()
  await admin
    .from('students')
    .update({
      unickorn_subscription_status: status,
      unickorn_subscription_tier: tier,
      unickorn_stripe_subscription_id: subscription.id,
    })
    .eq('stripe_customer_id', subscription.customer)

  return NextResponse.json({ received: true })
}
