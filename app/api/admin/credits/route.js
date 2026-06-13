import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { adminAdjustCredit, ReferralError } from '@/lib/referrals'

// Manual credit add/remove for any user (rule #9). Use a negative amount to
// remove credit.
export async function POST(request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const userId = body?.userId
  const amount = Number(body?.amount)
  const note = body?.note

  if (!userId || !Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: 'userId and a non-zero amount are required.' }, { status: 400 })
  }

  try {
    const transaction = await adminAdjustCredit({ userId, amount, note })
    return NextResponse.json({ transaction })
  } catch (err) {
    if (err instanceof ReferralError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }
}
