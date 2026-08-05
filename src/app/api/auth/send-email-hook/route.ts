import { NextRequest, NextResponse } from 'next/server'
import { Webhook, WebhookVerificationError } from 'standardwebhooks'
import { sendAuthActionEmail } from '@/lib/email/send'

// Supabase Auth "Send Email Hook": Supabase wywołuje ten endpoint zamiast
// wysyłać maile logowania samodzielnie. Bez tego hooka Supabase używa
// własnego, angielskiego, niebrandowanego szablonu — i buduje link z
// Site URL projektu, co przy błędnej konfiguracji (localhost:3000) blokuje
// WSZYSTKIM ustawienie hasła. Ten endpoint przejmuje wysyłkę w całości.
//
// Konfiguracja jednorazowa w panelu Supabase (Authentication → Hooks →
// „Send Email hook”, typ HTTPS): URL tego endpointu + wygenerowany sekret
// jako zmienna środowiskowa SEND_EMAIL_HOOK_SECRET w Vercelu. Dopóki hook
// nie jest tam podłączony, ten route nigdy nie zostanie wywołany — Supabase
// dalej wysyła własne maile, więc wdrożenie tego pliku samo w sobie niczego
// nie psuje.
//
// Sekret z panelu Supabase ma postać "v1,whsec_<base64>" — biblioteka
// standardwebhooks oczekuje samego base64, stąd obcięcie prefiksu. Wzorzec
// dokładnie taki, jak w oficjalnej dokumentacji Supabase (Deno: `.replace
// ('v1,whsec_', '')`), żeby nie zgadywać formatu przy czymś, co blokuje
// logowanie każdemu, jeśli się pomylimy.

export const runtime = 'nodejs'

type SendEmailHookPayload = {
  user: {
    email: string
    user_metadata?: Record<string, unknown> | null
  }
  email_data: {
    token_hash: string
    redirect_to: string
    email_action_type: string
  }
}

function isSendEmailHookPayload(v: unknown): v is SendEmailHookPayload {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  const user = o.user as Record<string, unknown> | undefined
  const emailData = o.email_data as Record<string, unknown> | undefined
  return (
    !!user && typeof user.email === 'string' &&
    !!emailData &&
    typeof emailData.token_hash === 'string' &&
    typeof emailData.redirect_to === 'string' &&
    typeof emailData.email_action_type === 'string'
  )
}

export async function POST(req: NextRequest) {
  const rawSecret = process.env.SEND_EMAIL_HOOK_SECRET
  if (!rawSecret) {
    // Nie 401 — to nie jest podpis odrzucony, tylko brak konfiguracji po
    // naszej stronie. Rozróżnienie ułatwia diagnozę w logach Vercela.
    console.error('[SendEmailHook] Brak SEND_EMAIL_HOOK_SECRET w środowisku.')
    return NextResponse.json({ error: { message: 'Hook nieskonfigurowany' } }, { status: 500 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  let verified: unknown
  try {
    const wh = new Webhook(rawSecret.replace('v1,whsec_', ''))
    verified = wh.verify(payload, headers)
  } catch (err) {
    const msg = err instanceof WebhookVerificationError ? err.message : 'Weryfikacja nie powiodła się'
    console.error('[SendEmailHook] Odrzucony podpis:', msg)
    return NextResponse.json({ error: { http_code: 401, message: msg } }, { status: 401 })
  }

  if (!isSendEmailHookPayload(verified)) {
    console.error('[SendEmailHook] Nieoczekiwany kształt payloadu:', JSON.stringify(verified).slice(0, 500))
    return NextResponse.json({ error: { message: 'Nieoczekiwany payload' } }, { status: 400 })
  }

  const { user, email_data } = verified
  const { token_hash, redirect_to, email_action_type } = email_data

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.error('[SendEmailHook] Brak NEXT_PUBLIC_SUPABASE_URL.')
    return NextResponse.json({ error: { message: 'Brak konfiguracji Supabase URL' } }, { status: 500 })
  }

  const verifyUrl =
    `${supabaseUrl}/auth/v1/verify` +
    `?token=${encodeURIComponent(token_hash)}` +
    `&type=${encodeURIComponent(email_action_type)}` +
    `&redirect_to=${encodeURIComponent(redirect_to)}`

  const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : ''
  const firstName = fullName.trim().split(/\s+/)[0] ?? ''

  try {
    await sendAuthActionEmail(user.email, {
      actionType: email_action_type,
      firstName,
      verifyUrl,
    })
  } catch (err) {
    // Świadomie NIE połykamy tego błędu (w odróżnieniu od reszty maili
    // w aplikacji) — to jedyny kanał dostarczenia linku logowania. Zwrócenie
    // błędu Supabase powoduje, że resetPasswordForEmail() na kliencie dostaje
    // realny błąd zamiast fałszywego "sprawdź skrzynkę", które nigdy by nie
    // nadeszło.
    console.error(`[SendEmailHook] Nie udało się wysłać maila do ${user.email}:`, err)
    return NextResponse.json({ error: { message: 'Nie udało się wysłać e-maila' } }, { status: 500 })
  }

  return NextResponse.json({}, { status: 200 })
}
