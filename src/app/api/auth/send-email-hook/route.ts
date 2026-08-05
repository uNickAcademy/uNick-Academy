import { NextRequest } from 'next/server'
import {
  verifyAuthEmailHook,
  metadataFirstName,
  metadataFullName,
  type AuthHookUser,
} from '@/lib/auth/email-hook'
import { buildAuthEmailMessages } from '@/lib/email/auth-email'
import { sendAuthActionEmail } from '@/lib/email/send'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function accountFirstName(user: AuthHookUser): Promise<string | null> {
  const explicitFirstName = metadataFirstName(user)
  if (explicitFirstName) return explicitFirstName
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null

  try {
    const admin = createAdminClient()
    let fullName = metadataFullName(user)

    if (!fullName) {
      const { data, error } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()
      if (error) throw error
      fullName = typeof data?.full_name === 'string' ? data.full_name.trim() : null
    }

    if (!fullName || fullName.includes('@')) return null

    const { data, error } = await admin.rpc('pick_first_name', { p_name: fullName })
    if (error) throw error
    const detected = Array.isArray(data) ? data[0] : data
    const firstName = typeof detected?.imie === 'string' ? detected.imie.trim() : ''
    const confidence = typeof detected?.pewnosc === 'string' ? detected.pewnosc : ''

    // Przy niejednoznacznych danych bezpieczniej użyć neutralnego „Cześć,”
    // niż zwrócić się do ucznia po nazwisku.
    return firstName && confidence !== 'niepewne' ? firstName : null
  } catch (error) {
    console.error('[AuthEmailHook] Nie udało się pobrać imienia:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  const configuredSecrets =
    process.env.SEND_EMAIL_HOOK_SECRETS || process.env.SEND_EMAIL_HOOK_SECRET || ''

  if (!configuredSecrets) {
    console.error('[AuthEmailHook] Brak SEND_EMAIL_HOOK_SECRET(S).')
    return Response.json(
      { error: 'Usługa e-mail jest chwilowo niedostępna.' },
      { status: 503 }
    )
  }

  const rawBody = await request.text()
  let payload
  try {
    payload = verifyAuthEmailHook(rawBody, Object.fromEntries(request.headers), configuredSecrets)
  } catch (error) {
    console.error('[AuthEmailHook] Odrzucono nieprawidłowy podpis lub dane:', error)
    return Response.json({ error: 'Nieprawidłowe żądanie.' }, { status: 401 })
  }

  try {
    const firstName = await accountFirstName(payload.user)
    const messages = buildAuthEmailMessages(payload, firstName)
    const webhookId = request.headers.get('webhook-id') || 'auth-email'
    await Promise.all(messages.map((message, index) =>
      sendAuthActionEmail(message, `${webhookId}-${index}`)
    ))
    // Supabase Auth wymaga odpowiedzi JSON również wtedy, gdy hook nie zwraca danych.
    return Response.json({}, { status: 200 })
  } catch (error) {
    // 503 powoduje ponowienie próby przez Supabase (maks. 3 próby w budżecie 5 s).
    console.error('[AuthEmailHook] Wysyłka nie powiodła się:', error)
    return Response.json({ error: 'Nie udało się wysłać wiadomości.' }, { status: 503 })
  }
}
