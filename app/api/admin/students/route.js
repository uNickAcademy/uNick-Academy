import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCreditSummary } from '@/lib/referrals'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const db = createAdminClient()

  const { data: students } = await db
    .from('students')
    .select('id, full_name, phone, referral_code, profiles(email)')
    .is('deleted_at', null)
    .order('full_name')

  const result = await Promise.all(
    (students || []).map(async (s) => {
      const credit = await getCreditSummary(s.id)
      return {
        id: s.id,
        name: s.full_name,
        email: s.profiles?.email,
        phone: s.phone,
        referralCode: s.referral_code,
        creditBalance: credit.balance,
      }
    })
  )

  return NextResponse.json({ users: result })
}
