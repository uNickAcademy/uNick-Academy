import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const WEEKS_PER_MONTH = 4.33

// Nalicza miesięczny abonament aktywnym/próbnym uczniom (pomija już naliczonych w tym miesiącu)
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'reception'].includes(prof?.role ?? '')) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })

  // Domyślna cena miesięczna z planu 1 lekcja/tydzień
  const { data: plans } = await supabase
    .from('pricing_plans').select('lessons_per_week, price_per_lesson').eq('is_active', true).order('lessons_per_week')
  const basePlan = plans?.[0]
  const defaultMonthly = basePlan ? Math.round(Number(basePlan.price_per_lesson) * basePlan.lessons_per_week * WEEKS_PER_MONTH) : 0

  const { data: students } = await supabase
    .from('students')
    .select('id, custom_monthly_price, status, profile:profiles(full_name)')
    .in('status', ['active', 'trial'])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthLabel = now.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

  let charged = 0
  let total = 0
  const skipped: string[] = []

  for (const s of students ?? []) {
    const price = s.custom_monthly_price != null ? Number(s.custom_monthly_price) : defaultMonthly
    if (price <= 0) continue

    // pomiń, jeśli już naliczono abonament w tym miesiącu
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('student_id', s.id)
      .eq('type', 'charge')
      .ilike('description', 'Abonament%')
      .gte('created_at', monthStart)
      .limit(1)

    if (existing && existing.length > 0) {
      // @ts-expect-error zagnieżdżony profil
      skipped.push(s.profile?.full_name ?? '—')
      continue
    }

    await supabase.from('transactions').insert({
      student_id: s.id, type: 'charge', amount: price, description: `Abonament ${monthLabel}`,
    })
    charged++
    total += price
  }

  return NextResponse.json({ success: true, charged, total, skipped, monthLabel })
}
