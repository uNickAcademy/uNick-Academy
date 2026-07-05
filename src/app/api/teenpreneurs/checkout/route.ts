import { NextRequest, NextResponse } from 'next/server'
import { getTpStripe } from '@/lib/teenpreneurs/stripe'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import {
  currencyForLocale, findVariant, TP_SHIPPING_COUNTRIES,
} from '@/lib/teenpreneurs/products'

// Shop checkout: validates the cart against the server-side products config
// (client prices are never trusted) and opens a Stripe Checkout session.
export async function POST(req: NextRequest) {
  const stripe = getTpStripe()
  if (!stripe) return NextResponse.json({ error: 'not configured' }, { status: 503 })

  const { items, locale = 'en' } = await req.json()
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'empty cart' }, { status: 400 })
  }

  const currency = currencyForLocale(locale)
  const dict = getTpDictionary(locale)

  const lineItems = []
  let hasPhysical = false
  const compactItems: { v: string; q: number }[] = []

  for (const item of items) {
    const qty = Math.max(1, Math.min(10, Number(item?.qty) || 0))
    const hit = typeof item?.variantId === 'string' ? findVariant(item.variantId) : undefined
    if (!hit || !qty) return NextResponse.json({ error: 'invalid item' }, { status: 400 })

    const { product, variant } = hit
    if (variant.requiresShipping) hasPhysical = true
    compactItems.push({ v: variant.id, q: qty })
    lineItems.push({
      quantity: qty,
      price_data: {
        currency,
        unit_amount: variant.prices[currency],
        product_data: {
          name: `${dict.shop.products[product.copyKey].name} — ${dict.shop.variants[variant.labelKey]}`,
        },
      },
    })
  }

  const origin = req.nextUrl.origin
  const base = `${origin}/teenpreneurs/${locale}`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    automatic_tax: { enabled: true },
    // Shipping address only when a physical item is in the cart.
    ...(hasPhysical && {
      shipping_address_collection: {
        allowed_countries: TP_SHIPPING_COUNTRIES as import('stripe').Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
    }),
    success_url: `${base}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/shop/cancelled`,
    // The webhook rebuilds the order from this metadata — source of truth.
    metadata: {
      scope: 'tp_shop',
      locale,
      items: JSON.stringify(compactItems),
    },
  })

  return NextResponse.json({ url: session.url })
}
