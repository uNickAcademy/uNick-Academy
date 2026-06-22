import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { listReferralsForAdmin } from '@/lib/referrals'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const referrals = await listReferralsForAdmin()
  return NextResponse.json({ referrals })
}
