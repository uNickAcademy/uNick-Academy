import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMonthlyPayment } from '@/lib/email/send'
import { createCheckoutSession } from '@/lib/stripe/checkout'

const WEEKS_PER_MONTH = 4.33

// Cron 1. dnia miesiąca (vercel.json: "0 6 1 * *").
// Nalicza abonament z góry za bieżący miesiąc każdemu aktywnemu uczniowi
// indywidualnemu i wysyła mailem link do płatności Stripe.
// Uczniowie B2B są pomijani — ich rozlicza faktura firmowa.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const base = process.env.NEXT_PUBLIC_APP_URL || ''

  // Domyślna cena miesięczna z planu 1 lekcja/tydzień — używana, gdy uczeń
  // nie ma ustawionej ceny indywidualnej.
  const { data: plans } = await supabase
    .from('pricing_plans').select('lessons_per_week, price_per_lesson').eq('is_active', true).order('lessons_per_week')
  const basePlan = plans?.[0]
  const defaultMonthly = basePlan
    ? Math.round(Number(basePlan.price_per_lesson) * Number(basePlan.lessons_per_week) * WEEKS_PER_MONTH)
    : 0

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, custom_monthly_price, billing_type, profile:profiles(full_name, email)')
    .in('status', ['active', 'trial'])
    .is('deleted_at', null)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthLabel = now.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

  let charged = 0
  let emailed = 0
  let total = 0
  const skipped: string[] = []

  for (const s of students ?? []) {
    if (s.billing_type === 'b2b') continue

    const price = s.custom_monthly_price != null ? Number(s.custom_monthly_price) : defaultMonthly
    if (!(price > 0)) continue

    const sp = s.profile as { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | undefined
    const profile = Array.isArray(sp) ? sp[0] : sp
    const name = (s.full_name as string) || profile?.full_name || 'Uczniu'

    // Nie naliczamy dwa razy w tym samym miesiącu (np. przy ponownym wywołaniu).
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('student_id', s.id)
      .eq('type', 'charge')
      .ilike('description', 'Abonament%')
      .gte('created_at', monthStart)
      .limit(1)

    if (existing && existing.length > 0) {
      skipped.push(name)
      continue
    }

    await supabase.from('transactions').insert({
      student_id: s.id, type: 'charge', amount: price, description: `Abonament ${monthLabel}`,
    })
    charged++
    total += price

    if (!profile?.email) continue

    let paymentUrl: string | null = null
    try {
      paymentUrl = await createCheckoutSession({
        amount: price, studentId: s.id as string, email: profile.email,
        description: `Zajęcia — ${monthLabel}`,
        successUrl: `${base}/platnosci?success=true`,
        cancelUrl: `${base}/platnosci?cancelled=true`,
      })
    } catch (err) {
      console.error('[Cron monthly-billing] checkout error:', err)
    }

    await sendMonthlyPayment(profile.email, { studentName: name, monthLabel, amount: price, paymentUrl })
    emailed++
  }

  return NextResponse.json({ success: true, monthLabel, charged, emailed, total, skipped: skipped.length })
}
