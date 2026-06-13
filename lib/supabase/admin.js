import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client for privileged server-side writes (usage counters,
// session summaries, Stripe webhook updates). Never expose this to the client.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
