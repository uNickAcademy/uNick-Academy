import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const { amount, studentId, description } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'p24', 'blik'],
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: description || 'Lekcja – uNick Academy',
            },
            unit_amount: amount * 100, // grosze
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/platnosci?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/platnosci?cancelled=true`,
      metadata: { studentId },
      locale: 'pl',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Błąd płatności' }, { status: 500 })
  }
}
