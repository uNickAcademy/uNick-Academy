import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Generowanie harmonogramu lekcji dla grupy.
//
// Wołane z panelu po utworzeniu grupy albo po zmianie dnia/godziny zajęć.
// `regenerate` najpierw kasuje przyszłe, nieodbyte terminy — przeszłość
// i lekcje z oznaczoną frekwencją zostają nietknięte.
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'reception'].includes(profile.role as string)) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const { groupId, regenerate, durationMinutes } = await req.json()
  if (!groupId) return NextResponse.json({ error: 'Brakuje grupy' }, { status: 400 })

  const db = createAdminClient()
  let removed = 0

  if (regenerate) {
    const { data, error } = await db.rpc('clear_future_group_lessons', { p_group_id: groupId })
    if (error) {
      console.error('[Group lessons] clear error:', error)
      return NextResponse.json({ error: 'Nie udało się usunąć starych terminów.' }, { status: 500 })
    }
    removed = Number(data ?? 0)
  }

  const { data, error } = await db.rpc('generate_group_lessons', {
    p_group_id: groupId,
    p_duration_minutes: durationMinutes ?? 60,
  })
  if (error) {
    console.error('[Group lessons] generate error:', error)
    // Komunikaty z funkcji są pisane pod człowieka (brak nauczyciela, zła
    // godzina, brak dat) — przekazujemy je dalej zamiast chować za ogólnikiem.
    return NextResponse.json({ error: error.message || 'Nie udało się utworzyć lekcji.' }, { status: 400 })
  }

  return NextResponse.json({ success: true, created: Number(data ?? 0), removed })
}
