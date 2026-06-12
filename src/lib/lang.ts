import { cookies } from 'next/headers'
import type { Lang } from './i18n'

// Odczyt języka z ciasteczka (server components). Domyślnie PL.
export async function getLang(): Promise<Lang> {
  const store = await cookies()
  const v = store.get('lang')?.value
  return v === 'en' ? 'en' : 'pl'
}
