import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Teenpreneurs runs on its own Supabase project (Unick Academy International),
// separate from the school's database. Server-side only — the service role key
// must never reach the client. Lazy init so builds pass before keys are set.
export function createTpAdminClient(): SupabaseClient | null {
  const url = process.env.TP_SUPABASE_URL
  const key = process.env.TP_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
