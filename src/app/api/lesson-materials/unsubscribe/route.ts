import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { materialLocale, unsubscribeContactId } from '@/lib/lesson-materials/access'
import { confirmationPage } from '@/lib/lesson-materials/confirmation-page'

export function GET(request: NextRequest) {
  const language = materialLocale(request.nextUrl.searchParams.get('lang'))
  const pl = language === 'pl'
  return confirmationPage({
    language, action: 'unsubscribe',
    title: pl ? 'Wypisz się z newslettera' : 'Unsubscribe from the newsletter',
    description: pl ? 'Dostęp do materiałów działa niezależnie od subskrypcji.' : 'Your materials access is independent of your subscription.',
    button: pl ? 'Wypisz mnie' : 'Unsubscribe',
  })
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const language = materialLocale(form?.get('lang'))
  const pl = language === 'pl'
  const contactId = unsubscribeContactId(form?.get('token'))
  if (!contactId) return confirmationPage({
    language, status: 400,
    title: pl ? 'Link jest nieprawidłowy' : 'The link is invalid',
    description: pl ? 'Otwórz link do wypisania się z wiadomości lub napisz na hello@unick-academy.pl.' : 'Open the unsubscribe link from your email or contact hello@unick-academy.pl.',
  })
  const { error } = await createAdminClient().from('lesson_material_contacts')
    .update({ newsletter_unsubscribed_at: new Date().toISOString() }).eq('id', contactId)
  if (error) {
    console.error('Lesson materials unsubscribe failed', error.code)
    return confirmationPage({
      language, status: 503,
      title: pl ? 'Spróbuj ponownie' : 'Please try again',
      description: pl ? 'Otwórz link ponownie lub napisz na hello@unick-academy.pl.' : 'Reopen the link or contact hello@unick-academy.pl.',
    })
  }
  return confirmationPage({
    language,
    title: pl ? 'Subskrypcja zakończona' : 'You’re unsubscribed',
    description: pl ? 'Nadal możesz korzystać z fiszek i kart do rozmowy.' : 'You can still use the flashcards and conversation cards.',
  })
}
