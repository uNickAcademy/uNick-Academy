import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as Stripe.StripeConfig['apiVersion'],
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const studentId = session.metadata?.studentId
      if (studentId && session.payment_status === 'paid') {
        // Saldo przeliczy trigger trg_recalc_balance
        await supabase.from('transactions').insert({
          student_id: studentId,
          type: 'payment',
          amount: (session.amount_total ?? 0) / 100,
          description: 'Wpłata online (Stripe)',
        })
        await supabase.from('students').update({ status: 'active' }).eq('id', studentId)
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      // Znajdź studenta po stripe_customer_id
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (student) {
        // Dodaj transakcję wpłaty
        await supabase.from('transactions').insert({
          student_id: student.id,
          type: 'payment',
          amount: (invoice.amount_paid ?? 0) / 100,
          description: `Wpłata – faktura ${invoice.number}`,
        })

        // Zaktualizuj status studenta na aktywny
        await supabase
          .from('students')
          .update({ status: 'active' })
          .eq('id', student.id)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (student) {
        // Oznacz jako zaległość
        await supabase
          .from('students')
          .update({ status: 'overdue' })
          .eq('id', student.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (student) {
        await supabase
          .from('students')
          .update({ status: 'paused' })
          .eq('id', student.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
