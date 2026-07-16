import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSms, isSmsConfigured } from '@/lib/sms/send'

// Admiński test integracji SMS — wysyła jedną wiadomość na podany numer,
// żeby po wklejeniu SMSAPI_TOKEN od razu sprawdzić działanie.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'reception'].includes(prof?.role ?? '')) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  if (!isSmsConfigured()) {
    return NextResponse.json({ error: 'SMS nie jest skonfigurowany (brak SMSAPI_TOKEN)' }, { status: 503 })
  }

  const { phone } = await req.json()
  const clean = String(phone ?? '').trim()
  if (!clean) return NextResponse.json({ error: 'Podaj numer telefonu (z kierunkowym, np. +48...)' }, { status: 400 })

  const ok = await sendSms(clean, 'To jest testowa wiadomość z uNick Academy. Integracja SMS działa!')
  return NextResponse.json({ ok })
}
