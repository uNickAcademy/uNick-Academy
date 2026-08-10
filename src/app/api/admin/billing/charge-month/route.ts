import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chargeStudentsForPeriod, loadBillableStudents } from '@/lib/billing/charge'
import { periodOf, periodLabel, addMonths, type Period } from '@/lib/billing/engine'

// Ręczne naliczenie miesiąca z panelu — ta sama logika co cron
// /api/cron/monthly-billing, bez wysyłki maili.
//
// Body (opcjonalne):
//   dryRun: true      – tylko podgląd, nic nie zapisuje
//   offset: -1 | 1    – przesunięcie miesiąca względem bieżącego
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'reception'].includes(prof?.role ?? '')) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const dryRun = body.dryRun === true
  const offset = Number.isInteger(body.offset) ? Number(body.offset) : 0
  const period: Period = addMonths(periodOf(new Date()), offset)

  const students = await loadBillableStudents(supabase)
  const outcomes = await chargeStudentsForPeriod(supabase, students, period, { dryRun })

  const billed = outcomes.filter((o) => o.charged > 0)

  return NextResponse.json({
    success: true,
    dryRun,
    monthLabel: periodLabel(period),
    considered: outcomes.length,
    charged: billed.length,
    total: billed.reduce((a, o) => a + o.charged, 0),
    // Kto i za co — żeby przed zatwierdzeniem było widać, co poleci.
    details: billed.map((o) => ({
      name: o.student.name,
      amount: o.charged,
      lines: o.lines.map((l) => l.label),
    })),
    // Naliczone wcześniej (np. przy zapisie do grupy) — nie dubluje się.
    alreadyPaid: outcomes.filter((o) => o.charged <= 0 && o.due > 0).map((o) => o.student.name),
  })
}
