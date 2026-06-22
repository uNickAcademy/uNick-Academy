import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { adminAdjustCredit, ReferralError } from '@/lib/referrals'

export async function POST(request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const studentId = body?.studentId
  const amount = Number(body?.amount)
  const note = body?.note

  if (!studentId || !Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: 'studentId and a non-zero amount are required.' }, { status: 400 })
  }

  try {
    const transaction = await adminAdjustCredit({ studentId, amount, note })
    return NextResponse.json({ transaction })
  } catch (err) {
    if (err instanceof ReferralError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }
}
