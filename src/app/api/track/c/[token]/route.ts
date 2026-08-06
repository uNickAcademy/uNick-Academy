import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Przekierowanie zliczające kliknięcie.
//
// Adres docelowy przechodzi przez listę dozwolonych hostów. Bez tego endpoint
// byłby otwartym przekierowaniem: ktokolwiek mógłby wysłać link
// unick-academy.pl/api/track/c/<token>?u=<dowolna strona> i podszyć się pod
// naszą domenę.
const DOZWOLONE_HOSTY = new Set([
  'unick-academy.pl',
  'www.unick-academy.pl',
  'facebook.com',
  'www.facebook.com',
  'instagram.com',
  'www.instagram.com',
  'youtube.com',
  'www.youtube.com',
  'linkedin.com',
  'www.linkedin.com',
])

const FALLBACK = process.env.NEXT_PUBLIC_APP_URL || 'https://unick-academy.pl'

function bezpiecznyCel(raw: string | null): string {
  if (!raw) return FALLBACK
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return FALLBACK
    if (!DOZWOLONE_HOSTY.has(url.hostname.toLowerCase())) return FALLBACK
    return url.toString()
  } catch {
    return FALLBACK
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const cel = bezpiecznyCel(req.nextUrl.searchParams.get('u'))

  if (/^[0-9a-f-]{36}$/i.test(token)) {
    try {
      const admin = createAdminClient()
      await admin.rpc('record_email_click', {
        p_token: token,
        p_url: cel,
        p_user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
      })
    } catch (err) {
      // Zliczanie nigdy nie może zablokować przejścia użytkownika dalej.
      console.error('[Track click] Błąd zapisu:', err)
    }
  }

  return NextResponse.redirect(cel, { status: 302 })
}
