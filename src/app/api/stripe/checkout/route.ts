import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

// Leniwa inicjalizacja — klient powstaje dopiero w handlerze, gdy jest klucz.
// Dzięki temu build nie wywala się, gdy STRIPE_SECRET_KEY nie jest ustawiony.
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  return key
    ? new Stripe(key, { apiVersion: '2025-01-27.acacia' as Stripe.StripeConfig['apiVersion'] })
    : null
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Płatności nie są skonfigurowane.' }, { status: 503 })
    }

    const { amount, studentId, description } = await req.json()

    const value = Math.round(Number(amount))
    if (!Number.isFinite(value) || value < 1 || value > 50_000) {
      return NextResponse.json({ error: 'Nieprawidłowa kwota' }, { status: 400 })
    }
    const supabase = createAdminClient()
    const { data: student } = await supabase.from('students').select('id').eq('id', studentId).single()
    if (!student) {
      return NextResponse.json({ error: 'Nie znaleziono ucznia' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'p24', 'blik'],
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: description || 'Lekcja – uNick Academy',
            },
            unit_amount: value * 100, // grosze
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
