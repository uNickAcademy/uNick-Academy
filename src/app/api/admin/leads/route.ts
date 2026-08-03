import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const ALLOWED = ['contacted', 'qualified', 'won', 'lost'] as const
type AllowedStatus = (typeof ALLOWED)[number]

// Zmiana statusu zgłoszenia ze wspólnej skrzynki (/admin/zapisy).
export async function POST(req: NextRequest) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'reception'].includes(profile.role as string)) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const { id, status } = await req.json()
  if (!id || !ALLOWED.includes(status as AllowedStatus)) {
    return NextResponse.json({ error: 'Brakujące lub nieznane pola' }, { status: 400 })
  }

  const db = createAdminClient()
  const patch: Record<string, unknown> = { status, owner_id: user.id }

  // Oznaczenie „skontaktowano się" jest jednocześnie pierwszą odpowiedzią,
  // jeśli żadna jeszcze nie padła — `first_response_seconds` liczy się z tego
  // sam, jako kolumna generowana.
  if (status === 'contacted') {
    const { data: current } = await db.from('leads').select('first_response_at').eq('id', id).single()
    if (current && !current.first_response_at) patch.first_response_at = new Date().toISOString()
  }
  if (status === 'lost') patch.lost_reason = 'Zamknięte z panelu'

  const { error } = await db.from('leads').update(patch).eq('id', id)
  if (error) {
    console.error('[Admin leads] update error:', error)
    return NextResponse.json({ error: 'Nie udało się zapisać zmiany.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
