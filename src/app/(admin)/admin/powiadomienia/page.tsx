import { getRecentNotifications } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { NotificationsView } from './NotificationsView'

export const dynamic = 'force-dynamic'

export default async function PowiadomieniaPage() {
  const items = await getRecentNotifications(80)

  // Oznacz wszystkie jako przeczytane w momencie otwarcia strony
  const supabase = await createClient()
  await supabase.from('admin_notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)

  const rows = items.map((n) => ({
    id: n.id,
    createdAt: new Date(n.created_at).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' }),
    kind: n.kind,
    title: n.title,
    body: n.body ?? '',
    studentId: n.student_id,
    wasUnread: !n.read_at,
  }))

  return <NotificationsView items={rows} />
}
