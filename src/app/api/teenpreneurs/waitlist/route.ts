import { NextRequest, NextResponse } from 'next/server'
import { createTpAdminClient } from '@/lib/teenpreneurs/supabase'

// Waitlist sign-up → the existing waitlist_signups table in the
// teenpreneurs-website Supabase project (schema predates this site).
export async function POST(req: NextRequest) {
  const supabase = createTpAdminClient()
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 503 })

  const { fullName, email, age, locale = 'en' } = await req.json()
  if (!fullName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const { error } = await supabase.from('waitlist_signups').insert({
    full_name: String(fullName).trim().slice(0, 100),
    email: String(email).trim().toLowerCase(),
    age: age ? Number(age) : null,
    language: locale,
  })

  if (error) {
    console.error('[TP waitlist] insert failed:', error)
    return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
