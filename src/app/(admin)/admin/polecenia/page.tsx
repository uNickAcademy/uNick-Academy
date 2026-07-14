import { getAllReferrals, getAllStudents } from '@/lib/supabase/queries'
import { PoleceniaAdminView } from './PoleceniaAdminView'

export const dynamic = 'force-dynamic'

export default async function PoleceniaAdminPage() {
  const [referrals, students] = await Promise.all([getAllReferrals(), getAllStudents()])

  const byReferrer = new Map<string, { name: string; code: string; uses: number; credit: number; referred: { name: string; date: string }[] }>()
  for (const r of referrals) {
    const referrerName = r.referrer?.full_name ?? r.referrer?.profile?.full_name ?? '—'
    const entry = byReferrer.get(r.referrer_id) ?? {
      name: referrerName,
      code: r.referrer?.referral_code ?? r.code,
      uses: 0,
      credit: 0,
      referred: [],
    }
    entry.uses += 1
    entry.credit += Number(r.referrer_credit ?? 0)
    entry.referred.push({
      name: r.referred?.full_name ?? r.referred?.profile?.full_name ?? '—',
      date: r.created_at,
    })
    byReferrer.set(r.referrer_id, entry)
  }

  const referrers = Array.from(byReferrer.entries())
    .map(([studentId, e]) => ({ studentId, ...e }))
    .sort((a, b) => b.uses - a.uses)

  const allStudents = students.map((s) => ({
    id: s.id,
    name: s.full_name ?? s.profile?.full_name ?? '—',
    code: s.referral_code,
    balance: Number(s.credit_balance ?? 0),
  }))

  return <PoleceniaAdminView referrers={referrers} students={allStudents} />
}
