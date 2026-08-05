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

  // Kredyt oczekujący z poleceń — dla obu ról naraz (polecający i polecony).
  // Świadomie nie liczy się do salda: to obietnica, nie zaksięgowane pieniądze.
  const { data: pendingRows } = await supabase
    .from('v_referral_pending_credit')
    .select('rola, kwota_pln, prog_pln, wplacone_pln, brakuje_pln, postep_pct, druga_strona, expires_at')
    .eq('student_id', student.id)

  const pending = (pendingRows ?? []).map((r) => ({
    rola: r.rola as 'polecajacy' | 'polecony',
    kwota: Number(r.kwota_pln ?? 0),
    prog: Number(r.prog_pln ?? 0),
    wplacone: Number(r.wplacone_pln ?? 0),
    brakuje: Number(r.brakuje_pln ?? 0),
    postep: Number(r.postep_pct ?? 0),
    drugaStrona: (r.druga_strona as string | null) ?? '—',
  }))

  const referrals = await getStudentReferrals(student.id)
  const items = referrals.map((r) => ({
    id: r.id,
    name: r.referred?.full_name ?? r.referred?.profile?.full_name ?? '—',
    date: r.created_at,
    credit: Number(r.referrer_credit ?? 0),
  }))

  return <PoleceniaView lang={lang} code={student.referral_code} referrals={items} pending={pending} />
}
