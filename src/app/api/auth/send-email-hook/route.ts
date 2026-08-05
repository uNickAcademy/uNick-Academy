import { NextRequest } from 'next/server'
import { verifyAuthEmailHook, metadataFirstName } from '@/lib/auth/email-hook'
import { buildAuthEmailMessages } from '@/lib/email/auth-email'
import { sendAuthActionEmail } from '@/lib/email/send'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function profileFirstName(userId: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('profiles').select('full_name').eq('id', userId).maybeSingle()
    const fullName = typeof data?.full_name === 'string' ? data.full_name.trim() : ''
    return fullName ? fullName.split(/\s+/)[0] : null
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
    return new Response('Usługa e-mail jest chwilowo niedostępna.', { status: 503 })
  }

  const rawBody = await request.text()
  let payload
  try {
    payload = verifyAuthEmailHook(rawBody, Object.fromEntries(request.headers), configuredSecrets)
  } catch (error) {
    console.error('[AuthEmailHook] Odrzucono nieprawidłowy podpis lub dane:', error)
    return new Response('Nieprawidłowe żądanie.', { status: 401 })
  }

  try {
    const firstName = metadataFirstName(payload.user) || await profileFirstName(payload.user.id)
    const messages = buildAuthEmailMessages(payload, firstName)
    const webhookId = request.headers.get('webhook-id') || 'auth-email'
    await Promise.all(messages.map((message, index) =>
      sendAuthActionEmail(message, `${webhookId}-${index}`)
    ))
    return new Response(null, { status: 200 })
  } catch (error) {
    // 503 powoduje ponowienie próby przez Supabase (maks. 3 próby w budżecie 5 s).
    console.error('[AuthEmailHook] Wysyłka nie powiodła się:', error)
    return new Response('Nie udało się wysłać wiadomości.', { status: 503 })
  }
}
