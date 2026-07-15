import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendPaymentReceipt } from '@/lib/email/send'

// Wysyła paragon na e-mail ucznia po zaksięgowaniu wpłaty (best-effort, nie blokuje)
async function emailReceipt(
  supabase: ReturnType<typeof createAdminClient>,
  studentId: string, amount: number, method: string,
) {
  try {
    const { data: student } = await supabase
      .from('students')
      .select('full_name, profile:profiles(full_name, email)')
      .eq('id', studentId)
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prof: any = Array.isArray((student as any)?.profile) ? (student as any).profile[0] : (student as any)?.profile
    if (!prof?.email) return
    const { data: txs } = await supabase.from('transactions').select('type, amount').eq('student_id', studentId)
    const balanceAfter = (txs ?? []).reduce((acc, t) => t.type === 'charge' ? acc - Number(t.amount) : acc + Number(t.amount), 0)
    await sendPaymentReceipt(prof.email, {
      studentName: student?.full_name ?? prof.full_name ?? '',
      amount, method, balanceAfter,
    })
  } catch (err) {
    console.error('[Stripe] Nie udało się wysłać paragonu:', err)
  }
}

// Leniwa inicjalizacja — klient powstaje dopiero w handlerze, gdy jest klucz.
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  return key
    ? new Stripe(key, { apiVersion: '2025-01-27.acacia' as Stripe.StripeConfig['apiVersion'] })
    : null
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Płatności nie są skonfigurowane.' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
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
        const amount = (session.amount_total ?? 0) / 100
        // Saldo przeliczy trigger trg_recalc_balance
        await supabase.from('transactions').insert({
          student_id: studentId,
          type: 'payment',
          amount,
          description: 'Wpłata online (Stripe)',
        })
        await supabase.from('students').update({ status: 'active' }).eq('id', studentId)
        await emailReceipt(supabase, studentId, amount, 'Płatność online (BLIK / Przelewy24 / karta)')
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
        const amount = (invoice.amount_paid ?? 0) / 100
        // Dodaj transakcję wpłaty
        await supabase.from('transactions').insert({
          student_id: student.id,
          type: 'payment',
          amount,
          description: `Wpłata – faktura ${invoice.number}`,
        })

        // Zaktualizuj status studenta na aktywny
        await supabase
          .from('students')
          .update({ status: 'active' })
          .eq('id', student.id)
        await emailReceipt(supabase, student.id, amount, `Faktura ${invoice.number}`)
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
