import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getTpStripe } from '@/lib/teenpreneurs/stripe'
import { createTpAdminClient } from '@/lib/teenpreneurs/supabase'
import { findVariant, TpCurrency } from '@/lib/teenpreneurs/products'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { createDownloadLinks } from '@/lib/teenpreneurs/downloads'
import {
  sendTpOrderConfirmation, sendTpEnrolmentWelcome, OrderEmailItem,
} from '@/lib/teenpreneurs/email'

// ─────────────────────────────────────────────────────────────
// Teenpreneurs Stripe webhook (own account: Unick Academy International).
// This — not the browser redirect — is the source of truth for fulfilment:
// order records, enrolments, emails and download links all originate here.
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const stripe = getTpStripe()
  const webhookSecret = process.env.TP_STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[TP webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const supabase = createTpAdminClient()
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 503 })

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.payment_status !== 'paid') return NextResponse.json({ received: true })

    if (session.metadata?.scope === 'tp_shop') {
      await handleShopOrder(supabase, session, siteUrl)
    } else if (session.metadata?.scope === 'tp_enrol') {
      await handleEnrolment(supabase, session)
    }
  }

  return NextResponse.json({ received: true })
}

type TpDb = NonNullable<ReturnType<typeof createTpAdminClient>>

async function handleShopOrder(supabase: TpDb, session: Stripe.Checkout.Session, siteUrl: string) {
  const locale = session.metadata?.locale || 'en'
  const dict = getTpDictionary(locale)
  const email = session.customer_details?.email
  if (!email) return

  let compact: { v: string; q: number }[] = []
  try {
    compact = JSON.parse(session.metadata?.items || '[]')
  } catch {
    console.error('[TP webhook] unparseable items metadata for', session.id)
    return
  }

  const currency = (session.currency || 'eur') as TpCurrency
  // Shipping address: newer API versions moved it under collected_information.
  const s = session as Stripe.Checkout.Session & {
    collected_information?: { shipping_details?: { name?: string; address?: object } } | null
    shipping_details?: { name?: string; address?: object } | null
  }
  const shipping = s.collected_information?.shipping_details ?? s.shipping_details ?? null
  const hasPhysical = compact.some(i => findVariant(i.v)?.variant.requiresShipping)

  // Idempotency: unique stripe_session_id; a retry of the same event no-ops.
  const { data: order, error: orderError } = await supabase
    .from('tp_orders')
    .insert({
      email: email.toLowerCase(),
      customer_name: session.customer_details?.name ?? shipping?.name ?? null,
      stripe_session_id: session.id,
      stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      status: 'paid',
      amount_total_cents: session.amount_total ?? 0,
      currency,
      shipping_address: shipping ? JSON.parse(JSON.stringify(shipping)) : null,
      fulfilment_status: hasPhysical ? 'pending' : 'not_required',
      locale,
    })
    .select('id')
    .single()

  if (orderError) {
    if (orderError.code !== '23505') console.error('[TP webhook] order insert failed:', orderError)
    return // duplicate event or hard failure — nothing more to do
  }

  const emailItems: OrderEmailItem[] = []
  const digitalItems: { orderItemId: string; storagePath: string; productName: string }[] = []

  for (const line of compact) {
    const hit = findVariant(line.v)
    if (!hit) continue
    const { product, variant } = hit
    const name = `${dict.shop.products[product.copyKey].name} — ${dict.shop.variants[variant.labelKey]}`

    const { data: orderItem, error: itemError } = await supabase
      .from('tp_order_items')
      .insert({
        order_id: order.id,
        variant_id: variant.id,
        product_name: name,
        quantity: line.q,
        unit_amount_cents: variant.prices[currency] ?? 0,
        is_digital: !variant.requiresShipping,
      })
      .select('id')
      .single()
    if (itemError || !orderItem) {
      console.error('[TP webhook] order item insert failed:', itemError)
      continue
    }

    emailItems.push({ name, qty: line.q, unitAmount: variant.prices[currency] ?? 0 })
    if (!variant.requiresShipping && variant.storagePath) {
      digitalItems.push({ orderItemId: orderItem.id, storagePath: variant.storagePath, productName: name })
    }
  }

  const downloads = await createDownloadLinks(supabase, digitalItems, siteUrl)

  await sendTpOrderConfirmation({
    to: email,
    locale,
    items: emailItems,
    total: session.amount_total ?? 0,
    currency,
    downloads,
    hasPhysical,
    siteUrl,
  })
}

async function handleEnrolment(supabase: TpDb, session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {}
  const locale = meta.locale || 'en'
  const email = session.customer_details?.email
  if (!email) return

  const { error } = await supabase.from('tp_enrolments').insert({
    student_name: meta.studentName || '',
    parent_name: meta.parentName || null,
    email: email.toLowerCase(),
    age_track: meta.ageTrack === '16-19' ? '16-19' : '13-15',
    time_slot: meta.timeSlot || '',
    stripe_session_id: session.id,
    status: 'paid',
    amount_cents: session.amount_total ?? 0,
    currency: session.currency || 'eur',
    locale,
  })

  if (error) {
    if (error.code !== '23505') console.error('[TP webhook] enrolment insert failed:', error)
    return
  }

  const dict = getTpDictionary(locale)
  const slotLabel =
    dict.enrol.form.slots[meta.timeSlot as keyof typeof dict.enrol.form.slots] ?? meta.timeSlot ?? ''

  await sendTpEnrolmentWelcome({
    to: email,
    locale,
    studentName: meta.studentName || '',
    ageTrack: meta.ageTrack || '',
    timeSlotLabel: slotLabel,
  })
}
