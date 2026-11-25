import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function voucherStaff() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return null
  const profile = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (profile.error || !['admin', 'reception'].includes(profile.data?.role ?? '')) return null
  return { db: createAdminClient(), user, role: profile.data!.role as string }
}
