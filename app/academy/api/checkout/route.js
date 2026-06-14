import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getPriceId, CURRENCIES } from '@/lib/constants'

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/academy/signup?redirect=/academy/pricing', request.url))
  }

  const formData = await request.formData()
  const plan = formData.get('plan')
  const currency = formData.get('currency')

  if (!['monthly', 'annual'].includes(plan) || !CURRENCIES.includes(currency)) {
    return NextResponse.json({ error: 'Invalid plan or currency.' }, { status: 400 })
  }

  const priceId = getPriceId(plan, currency)
  if (!priceId) {
    return NextResponse.json({ error: 'This plan is not available yet.' }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/academy/account?checkout=success`,
    cancel_url: `${siteUrl}/academy/pricing`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    // Prices are tax-exclusive (net) - Stripe Tax adds VAT on top based on
    // the customer's location. Requires Stripe Tax to be enabled with an
    // origin address configured in the Dashboard.
    automatic_tax: { enabled: true },
    customer_update: { address: 'auto', name: 'auto' },
  })

  return NextResponse.redirect(session.url, 303)
}
