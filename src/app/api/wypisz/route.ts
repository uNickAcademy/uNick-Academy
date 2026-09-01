import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Wypisanie z wysyłek marketingowych.
//
// Tylko POST, nigdy GET. Skanery bezpieczeństwa i filtry antyspamowe same
// odwiedzają linki z maila, zanim zrobi to człowiek — link wypisujący pod GET
// wypisywałby ludzi, którzy w niego nawet nie kliknęli. Stronę /wypisz-sie
// można pobrać do woli, dopiero przycisk wysyła to żądanie.
//
// Token to `track_token` z wiersza wysyłki: jest jednorazowo wygenerowany na
// odbiorcę, więc nie da się z niego odgadnąć cudzego adresu ani wypisać kogoś
// innego. Sam adres znamy z wiersza logu, więc nikt nie musi go tu podawać.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const token: string = typeof body.token === 'string' ? body.token.trim() : ''

  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return NextResponse.json({ error: 'Nieprawidłowy link.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: wpis, error: readErr } = await admin
    .from('email_campaign_log')
    .select('email, campaign, student_id')
    .eq('track_token', token)
    .maybeSingle()

  if (readErr) {
    console.error('[Wypisanie] Błąd odczytu logu:', readErr)
    return NextResponse.json({ error: 'Nie udało się teraz zapisać rezygnacji. Spróbuj za chwilę.' }, { status: 500 })
  }
  if (!wpis?.email) {
    return NextResponse.json({ error: 'Nie rozpoznajemy tego linku.' }, { status: 404 })
  }

  const email = (wpis.email as string).trim().toLowerCase()

  const { error: writeErr } = await admin
    .from('email_optouts')
    .upsert(
      {
        email_norm: email,
        student_id: (wpis.student_id as string | null) ?? null,
        campaign: (wpis.campaign as string | null) ?? null,
        source: 'link_w_mailu',
      },
      { onConflict: 'email_norm', ignoreDuplicates: true },
    )

  if (writeErr) {
    console.error('[Wypisanie] Błąd zapisu:', writeErr)
    return NextResponse.json({ error: 'Nie udało się teraz zapisać rezygnacji. Spróbuj za chwilę.' }, { status: 500 })
  }

  // Adresu nie odsyłamy w całości: stronę może otworzyć ktoś, komu mail
  // przekazano dalej, a link nie powinien zdradzać cudzej skrzynki.
  const [lokalna, domena] = email.split('@')
  const zamaskowany = `${lokalna.slice(0, 2)}${'*'.repeat(Math.max(1, lokalna.length - 2))}@${domena ?? ''}`

  return NextResponse.json({ ok: true, adres: zamaskowany })
}
