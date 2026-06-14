import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const STATUS_MAP = {
  active: 'active',
  trialing: 'active',
  past_due: 'past_due',
  unpaid: 'past_due',
  canceled: 'cancelled',
  incomplete_expired: 'cancelled',
  incomplete: 'none',
  paused: 'cancelled',
}

export async function POST(request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Idempotency: the primary key on stripe_webhook_events.id rejects
  // duplicate deliveries of the same event.
  const { error: insertError } = await supabase
    .from('stripe_webhook_events')
    .insert({ id: event.id, type: event.type })

  if (insertError) {
    return NextResponse.json({ received: true })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        await syncSubscription(supabase, subscription)
      }
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await syncSubscription(supabase, event.data.object)
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}

async function syncSubscription(supabase, subscription) {
  const item = subscription.items.data[0]
  const price = item?.price
  const status = STATUS_MAP[subscription.status] ?? 'none'
  const plan = price?.recurring?.interval === 'year' ? 'annual' : 'monthly'

  await supabase
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_currency: price?.currency ?? null,
      subscription_plan: plan,
    })
    .eq('stripe_customer_id', subscription.customer)
}
