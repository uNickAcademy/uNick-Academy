import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStudentForUser } from '@/lib/unickorn/student'
import { tierForStudent, UNICKORN_STRIPE_PRICES } from '@/lib/unickorn/config'
import { createStripeClient } from '@/lib/stripe'

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const student = await getStudentForUser(user.id)
  if (!student) {
    return NextResponse.json({ error: 'student_not_found' }, { status: 404 })
  }

  const tier = tierForStudent(student)
  const price = UNICKORN_STRIPE_PRICES[tier]
  if (!price) {
    return NextResponse.json({ error: 'price_not_configured' }, { status: 500 })
  }

  const stripe = createStripeClient()
  const admin = createAdminClient()

  let customerId = student.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { student_id: student.id },
    })
    customerId = customer.id
    await admin.from('students').update({ stripe_customer_id: customerId }).eq('id', student.id)
  }

  const { origin } = new URL(request.url)

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/academy/talk-to-unickorn?checkout=success`,
    cancel_url: `${origin}/academy/talk-to-unickorn?checkout=cancelled`,
    subscription_data: { metadata: { student_id: student.id, unickorn_tier: tier } },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
