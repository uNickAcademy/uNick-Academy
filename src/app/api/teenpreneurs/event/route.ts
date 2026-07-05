import { NextRequest, NextResponse } from 'next/server'
import { createTpAdminClient } from '@/lib/teenpreneurs/supabase'
import { sendTpEventConfirmation } from '@/lib/teenpreneurs/email'
import { TP_EVENT } from '@/lib/teenpreneurs/products'

// Free-event registration → Supabase + confirmation email.
export async function POST(req: NextRequest) {
  const supabase = createTpAdminClient()
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 503 })

  const { name, email, consent, locale = 'en' } = await req.json()
  if (!name?.trim() || !email?.trim() || !consent) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const { error } = await supabase.from('tp_event_registrations').insert({
    event_slug: TP_EVENT.slug,
    name: String(name).trim().slice(0, 100),
    email: String(email).trim().toLowerCase(),
    parent_consent: true,
    locale,
  })

  if (error) {
    // 23505 = unique violation → this email is already registered.
    if (error.code === '23505') return NextResponse.json({ duplicate: true }, { status: 409 })
    console.error('[TP event] insert failed:', error)
    return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  }

  await sendTpEventConfirmation({ to: String(email).trim(), locale })
  return NextResponse.json({ success: true })
}
