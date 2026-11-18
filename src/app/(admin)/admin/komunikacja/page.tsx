import Link from 'next/link'
import { getAllGroups } from '@/lib/supabase/queries'
import { isEmailConfigured } from '@/lib/email/send'
import { isWhatsAppConfigured } from '@/lib/whatsapp/send'
import { isSmsConfigured } from '@/lib/sms/send'
import { CommunicationView } from './CommunicationView'
import { ComebackCampaign } from './ComebackCampaign'

export const dynamic = 'force-dynamic'

export default async function KomunikacjaPage() {
  const groups = await getAllGroups()
  const groupOptions = groups.filter((g) => g.is_active).map((g) => ({ id: g.id, name: g.name }))
  return (
    <>
      <CommunicationView
        groupOptions={groupOptions}
        emailConfigured={isEmailConfigured()}
        whatsappConfigured={isWhatsAppConfigured()}
        smsConfigured={isSmsConfigured()}
      />
      <div className="max-w-3xl mx-auto px-8">
        <p className="my-6"><Link className="text-blue-800 underline" href="/admin/komunikacja/materialy">Kontakty z biblioteki fiszek</Link></p>
        <ComebackCampaign />
      </div>
    </>
  )
}
