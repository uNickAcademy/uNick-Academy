import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMonthlyPayment } from '@/lib/email/send'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { chargeStudentsForPeriod, loadBillableStudents } from '@/lib/billing/charge'
import { billFamilies } from '@/lib/billing/family'
import { periodOf, periodLabel } from '@/lib/billing/engine'

// Cron 1. dnia miesiąca (vercel.json: "0 6 1 * *").
//
// Nalicza z góry bieżący miesiąc: grupom cenę z karty kursu, uczniom
// indywidualnym liczbę lekcji w tym miesiącu razy stawkę z cennika. Kto nie ma
// ani kursu w toku, ani lekcji w danym miesiącu, nie dostaje nic — wcześniej
// każdy aktywny uczeń dostawał ryczałt z domyślnego planu, także wtedy, gdy
// jego kurs jeszcze się nie zaczął.
//
// Pierwszy miesiąc kursu jest naliczany już przy zapisie, więc tutaj wychodzi
// różnica równa zeru i nikt nie płaci dwa razy.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const base = process.env.NEXT_PUBLIC_APP_URL || ''
  const period = periodOf(new Date())
  const label = periodLabel(period)

  const students = await loadBillableStudents(supabase)
  const outcomes = await chargeStudentsForPeriod(supabase, students, period)

  // Obciążenia zostają per podkonto, ale rachunek idzie jeden na rodzinę.
  const billed = await billFamilies(supabase, outcomes, label, {
    createCheckout: (opts) => createCheckoutSession({
      ...opts,
      successUrl: `${base}/platnosci?success=true`,
      cancelUrl: `${base}/platnosci?cancelled=true`,
    }),
    sendPayment: sendMonthlyPayment,
  })

  const charged = outcomes.filter((o) => o.charged > 0).length

  return NextResponse.json({
    success: true,
    monthLabel: label,
    considered: outcomes.length,
    charged,
    families: billed.families,
    emailed: billed.emailed,
    total: billed.total,
    skipped: outcomes.length - charged,
  })
}
