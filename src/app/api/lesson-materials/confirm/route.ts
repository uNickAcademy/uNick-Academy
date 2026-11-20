import { NextRequest, NextResponse } from 'next/server'
import { materialAccessPath } from '@/lib/lesson-materials/catalogue'
import { createAdminClient } from '@/lib/supabase/server'
import {
  accessTokenPattern, createMaterialsSession, hashAccessToken, materialLocale,
  MATERIALS_COOKIE, PRIVATE_RESPONSE_HEADERS, SESSION_SECONDS,
} from '@/lib/lesson-materials/access'
import { confirmationPage } from '@/lib/lesson-materials/confirmation-page'

export function GET(request: NextRequest) {
  const language = materialLocale(request.nextUrl.searchParams.get('lang'))
  const pl = language === 'pl'
  return confirmationPage({
    language, action: 'confirm',
    title: pl ? 'Twoje materiały są gotowe' : 'Your materials are ready',
    description: pl ? 'Potwierdź dostęp do biblioteki uNick Academy.' : 'Confirm access to the uNick Academy library.',
    button: pl ? 'Otwórz materiały' : 'Open lesson materials',
  })
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const token = form?.get('token')
  const language = materialLocale(form?.get('lang'))
  const pl = language === 'pl'
  if (typeof token !== 'string' || !accessTokenPattern.test(token)) {
    return invalidLink()
  }
  const { data, error } = await createAdminClient()
    .rpc('confirm_lesson_material_access', { request_hash: hashAccessToken(token) }).maybeSingle()
  if (error) {
    console.error('Lesson materials confirmation failed', error.code)
    return confirmationPage({
      language, status: 503,
      title: pl ? 'Spróbuj ponownie' : 'Please try again',
      description: pl ? 'Chwilowo nie udało się otworzyć biblioteki. Otwórz ponownie link z wiadomości.' : 'The library is temporarily unavailable. Reopen your email link to try again.',
    })
  }
  if (!data) return invalidLink()
  const result = data as { language: string; requested_topic: string | null }
  const target = new URL(materialAccessPath(result.requested_topic, materialLocale(result.language)), request.url)
  const response = NextResponse.redirect(target, { status: 303, headers: PRIVATE_RESPONSE_HEADERS })
  response.cookies.set(MATERIALS_COOKIE, createMaterialsSession(), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: SESSION_SECONDS,
  })
  return response

  function invalidLink() {
    return confirmationPage({
      language, status: 400,
      title: pl ? 'Poproś o nowy link' : 'Request a new link',
      description: pl ? 'Ten link wygasł lub został już użyty. W bibliotece możesz poprosić o nową wiadomość.' : 'This link expired or was already used. Request a new one from the library.',
    })
  }
}
