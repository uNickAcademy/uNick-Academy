import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { adminSetReferralStatus, ReferralError } from '@/lib/referrals'

export async function PATCH(request, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const status = body?.status
  const adminNote = body?.adminNote

  if (!status) return NextResponse.json({ error: 'status is required.' }, { status: 400 })

  try {
    const referral = await adminSetReferralStatus({ referralId: id, status, adminNote })
    return NextResponse.json({ referral })
  } catch (err) {
    if (err instanceof ReferralError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }
}
