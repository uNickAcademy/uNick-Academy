import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendBulkWhatsApp, isWhatsAppConfigured } from '@/lib/whatsapp/send'

// Admiński test integracji WhatsApp — wysyła jedną wiadomość na podany numer,
// żeby po wklejeniu ZAPIER_WHATSAPP_WEBHOOK_URL od razu sprawdzić działanie.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'reception'].includes(prof?.role ?? '')) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  if (!isWhatsAppConfigured()) {
    return NextResponse.json({ error: 'WhatsApp nie jest skonfigurowany (brak WHATSAPP_WEBHOOK_URL)' }, { status: 503 })
  }

  const { phone } = await req.json()
  const clean = String(phone ?? '').trim()
  if (!clean) return NextResponse.json({ error: 'Podaj numer telefonu (z kierunkowym, np. +48...)' }, { status: 400 })

  const { sent, failed } = await sendBulkWhatsApp(
    [{ phone: clean, name: 'Test' }],
    'To jest testowa wiadomość z uNick Academy ✅ Integracja WhatsApp działa!',
  )
  return NextResponse.json({ sent, failed, ok: sent > 0 })
}
