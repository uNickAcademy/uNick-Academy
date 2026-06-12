import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let role = 'admin'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    role = profile?.role ?? 'admin'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar role={role} />
      <main className="flex-1 ml-60">{children}</main>
    </div>
  )
}
