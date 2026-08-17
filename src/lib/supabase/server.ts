import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { timeoutFetch } from './fetch'

// Zadania administracyjne (import, kampanie, cron) bywają cięższe niż zapytanie
// ze strony, więc dostają dłuższy limit — ale nadal skończony.
const ADMIN_TIMEOUT_MS = 60_000

// Klient z kluczem service_role — omija RLS, do operacji administracyjnych
// (tworzenie kont auth, zapisy itp.). NIGDY nie eksponować po stronie klienta.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: timeoutFetch(ADMIN_TIMEOUT_MS) },
    }
  )
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: timeoutFetch() },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — ignorujemy
          }
        },
      },
    }
  )
}
