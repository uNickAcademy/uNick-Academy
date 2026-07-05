import { NextRequest, NextResponse } from 'next/server'
import { getTpStripe } from '@/lib/teenpreneurs/stripe'
import { getTpDictionary } from '@/lib/teenpreneurs/i18n'
import { currencyForLocale, TP_ENROLMENT } from '@/lib/teenpreneurs/products'

// Founding-cohort enrolment: age track + time slot are captured before
// payment and ride the session metadata into the webhook.
export async function POST(req: NextRequest) {
  const stripe = getTpStripe()
  if (!stripe) return NextResponse.json({ error: 'not configured' }, { status: 503 })

  const { studentName, parentName, email, ageTrack, timeSlot, locale = 'en' } = await req.json()

  if (!studentName?.trim() || !parentName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }
  if (!(TP_ENROLMENT.ageTracks as readonly string[]).includes(ageTrack)) {
    return NextResponse.json({ error: 'invalid age track' }, { status: 400 })
  }
  if (!(TP_ENROLMENT.timeSlots as readonly string[]).includes(timeSlot)) {
    return NextResponse.json({ error: 'invalid time slot' }, { status: 400 })
  }

  const currency = currencyForLocale(locale)
  const dict = getTpDictionary(locale)
  const base = `${req.nextUrl.origin}/teenpreneurs/${locale}`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email.trim(),
    line_items: [{
      quantity: 1,
      price_data: {
        currency,
        unit_amount: TP_ENROLMENT.founding[currency],
        product_data: {
          name: `Teenpreneurs — ${dict.enrol.hero.kicker}`,
          description: `${dict.enrol.form.ageTrack}: ${ageTrack} · ${dict.enrol.form.slots[timeSlot as keyof typeof dict.enrol.form.slots]}`,
        },
      },
    }],
    automatic_tax: { enabled: true },
    success_url: `${base}/enrol/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/enrol`,
    metadata: {
      scope: 'tp_enrol',
      locale,
      studentName: String(studentName).slice(0, 100),
      parentName: String(parentName).slice(0, 100),
      ageTrack,
      timeSlot,
    },
  })

  return NextResponse.json({ url: session.url })
}
