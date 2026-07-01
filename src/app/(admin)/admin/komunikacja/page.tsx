import { getAllGroups } from '@/lib/supabase/queries'
import { isEmailConfigured } from '@/lib/email/send'
import { isWhatsAppConfigured } from '@/lib/whatsapp/send'
import { CommunicationView } from './CommunicationView'

export const dynamic = 'force-dynamic'

export default async function KomunikacjaPage() {
  const groups = await getAllGroups()
  const groupOptions = groups.filter((g) => g.is_active).map((g) => ({ id: g.id, name: g.name }))
  return (
    <CommunicationView
      groupOptions={groupOptions}
      emailConfigured={isEmailConfigured()}
      whatsappConfigured={isWhatsAppConfigured()}
      smsConfigured={false}
    />
  )
}
