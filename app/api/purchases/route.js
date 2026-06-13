import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { recordPurchase, redeemCredit, getMaxCreditRedemption } from '@/lib/referrals'

const VALID_TYPES = ['trial', 'single_lesson', 'package', 'monthly']

// Records a purchase for the current user. This is the integration point a
// real payments/booking flow would call after a successful payment; it
// triggers referral qualification (rule #4) and optionally redeems account
// credit (rule #6).
export async function POST(request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const amount = Number(body?.amount)
  const type = body?.type
  const useCredit = Boolean(body?.useCredit)

  if (!Number.isFinite(amount) || amount <= 0 || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'A positive amount and valid type are required.' }, { status: 400 })
  }

  let creditApplied = 0
  if (useCredit) {
    creditApplied = await getMaxCreditRedemption({ userId: user.id, amount, type })
  }

  const payableAmount = Math.round((amount - creditApplied) * 100) / 100
  const purchase = await recordPurchase({ userId: user.id, amount, type })

  if (creditApplied > 0) {
    await redeemCredit({ userId: user.id, purchaseId: purchase.id, amount: creditApplied })
  }

  return NextResponse.json({ purchase, creditApplied, payableAmount })
}
