import { createClient } from '@/lib/supabase/server'
import { getPendingBookingRequestsCount, getPendingOnlineBookingsCount, getUnreadNotificationCount, getUnhandledLeadsCount } from '@/lib/supabase/queries'
import { AdminSidebar } from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let role = 'admin'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    role = profile?.role ?? 'admin'
  }
  // Odznaka przy „Zapisy” obejmuje wszystkie źródła: nowe zgłoszenia ze
  // wspólnej skrzynki oraz zaległe prośby stacjonarne i zapisy online
  // sprzed przebudowy kreatora.
  const [stationaryRequests, onlineBookings, newLeads, unreadNotifications] = await Promise.all([
    getPendingBookingRequestsCount(),
    getPendingOnlineBookingsCount(),
    getUnhandledLeadsCount(),
    getUnreadNotificationCount(),
  ])
  const pendingRequests = stationaryRequests + onlineBookings + newLeads

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar role={role} pendingRequests={pendingRequests} unreadNotifications={unreadNotifications} />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-w-0">{children}</main>
    </div>
  )
}
