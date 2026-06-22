import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user || null
}

export async function getCurrentStudentId() {
  const user = await getCurrentUser()
  if (!user) return null

  const db = createAdminClient()
  const { data: student } = await db
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  return student?.id || null
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) return null

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return null
  return user
}
