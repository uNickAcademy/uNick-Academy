import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentByProfileId, getStudentReferrals } from '@/lib/supabase/queries'
import { getLang } from '@/lib/lang'
import { PoleceniaView } from './PoleceniaView'

export const dynamic = 'force-dynamic'

export default async function PoleceniaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lang = await getLang()
  const student = await getStudentByProfileId(user.id)
  if (!student) redirect('/dashboard')

  const referrals = await getStudentReferrals(student.id)
  const items = referrals.map((r) => ({
    id: r.id,
    name: r.referred?.full_name ?? r.referred?.profile?.full_name ?? '—',
    date: r.created_at,
    credit: Number(r.referrer_credit ?? 0),
  }))

  return <PoleceniaView lang={lang} code={student.referral_code} referrals={items} />
}
