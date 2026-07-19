import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ok: false }
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { supabase, ok: ['admin', 'reception'].includes(prof?.role ?? '') }
}

// GET → licznik nieprzeczytanych (dla dzwonka, odpytywane cyklicznie)
export async function GET() {
  const { supabase, ok } = await requireStaff()
  if (!ok) return NextResponse.json({ unread: 0 }, { status: 200 })
  const { count } = await supabase
    .from('admin_notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null)
  return NextResponse.json({ unread: count ?? 0 })
}

// POST → oznacz wszystkie jako przeczytane
export async function POST() {
  const { supabase, ok } = await requireStaff()
  if (!ok) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  const { error } = await supabase
    .from('admin_notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
