import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Łączenie zdublowanych kartotek. Cała praca dzieje się w funkcji bazodanowej
// merge_students() — jedna transakcja przepina lekcje, płatności, grupy, zgody
// i faktury, więc nie ma stanu pośredniego, w którym część historii wisi pod
// nieistniejącym uczniem.
export async function POST(req: Request) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (prof?.role !== 'admin') {
    return NextResponse.json({ error: 'Łączenie kartotek wymaga uprawnień administratora' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const keepId: unknown = body.keepId
  const mergeIds: string[] = Array.isArray(body.mergeIds)
    ? body.mergeIds.filter((id: unknown) => typeof id === 'string' && id !== keepId)
    : []

  if (typeof keepId !== 'string' || mergeIds.length === 0) {
    return NextResponse.json({ error: 'Wskaż kartotekę docelową i co najmniej jedną do połączenia' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data, error } = await db.rpc('merge_students', { p_keep: keepId, p_merge: mergeIds })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, merged: mergeIds.length, moved: data ?? {} })
}
