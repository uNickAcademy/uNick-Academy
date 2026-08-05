import type { EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

function safeNextPath(value: string | null, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  try {
    const parsed = new URL(value, 'https://unick-academy.pl')
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return fallback
  }
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const rawType = request.nextUrl.searchParams.get('type')
  const type = rawType && VALID_TYPES.has(rawType as EmailOtpType)
    ? rawType as EmailOtpType
    : null
  const fallback = type === 'recovery' ? '/reset-haslo' : '/login'
  const next = safeNextPath(request.nextUrl.searchParams.get('next'), fallback)

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(`${fallback}?error=invalid_link`, request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
  if (error) {
    console.error('[AuthConfirm] Nie udało się potwierdzić tokenu:', error.message)
    return NextResponse.redirect(new URL(`${fallback}?error=invalid_link`, request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}
