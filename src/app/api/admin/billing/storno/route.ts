import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Storno błędnego obciążenia: nie usuwamy transakcji, tylko dopisujemy korektę
// typu „credit" na kwotę długu. Trigger recalc_student_balance przeliczy saldo
// do zera, a pełna historia zostaje w rejestrze.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'reception'].includes(prof?.role ?? '')) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const studentIds: string[] = Array.isArray(body.studentIds) ? body.studentIds.filter((id: unknown) => typeof id === 'string') : []
  const reason: string = (typeof body.reason === 'string' && body.reason.trim()) || 'Korekta błędnego naliczenia'
  if (studentIds.length === 0) return NextResponse.json({ error: 'Nie wskazano studentów' }, { status: 400 })

  const { data: students, error: readError } = await supabase
    .from('students')
    .select('id, credit_balance')
    .in('id', studentIds)
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })

  const rows = (students ?? [])
    .map((s) => ({ id: s.id, owes: -Number(s.credit_balance) }))
    .filter((s) => s.owes > 0)

  if (rows.length === 0) return NextResponse.json({ success: true, count: 0, amount: 0 })

  const { error } = await supabase.from('transactions').insert(
    rows.map((r) => ({
      student_id: r.id,
      type: 'credit' as const,
      amount: r.owes,
      description: `Storno — ${reason}`,
    })),
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    count: rows.length,
    amount: rows.reduce((a, r) => a + r.owes, 0),
  })
}
