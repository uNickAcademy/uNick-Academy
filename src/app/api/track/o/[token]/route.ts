import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Piksel śledzący otwarcie. Zwraca przezroczysty GIF 1x1 ZAWSZE, także gdy
// token jest nieznany — inaczej odbiorca zobaczyłby połamany obrazek, a my
// zdradzilibyśmy, które tokeny istnieją.
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
)

function pixelResponse() {
  return new NextResponse(new Uint8Array(PIXEL), {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      // Bez cache, inaczej drugie otwarcie nie dotrze do serwera.
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
    },
  })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params

  if (!/^[0-9a-f-]{36}$/i.test(token)) return pixelResponse()

  try {
    const admin = createAdminClient()
    await admin.rpc('record_email_open', {
      p_token: token,
      p_user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    })
  } catch (err) {
    // Zliczanie nigdy nie może zepsuć wyświetlenia maila.
    console.error('[Track open] Błąd zapisu:', err)
  }

  return pixelResponse()
}
