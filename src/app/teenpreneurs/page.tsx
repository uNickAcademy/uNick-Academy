import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isTpLocale, tpDefaultLocale } from '@/lib/teenpreneurs/i18n'

// /teenpreneurs → remembered locale (cookie set by the language switch),
// falling back to English for the international audience.
export default async function TeenpreneursRoot() {
  const store = await cookies()
  const saved = store.get('tp_locale')?.value ?? ''
  redirect(`/teenpreneurs/${isTpLocale(saved) ? saved : tpDefaultLocale}`)
}
