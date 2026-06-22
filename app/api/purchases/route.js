import { NextResponse } from 'next/server'
import { getCurrentStudentId } from '@/lib/auth'
import { recordPurchase, redeemCredit, getMaxCreditRedemption } from '@/lib/referrals'

const VALID_TYPES = ['trial', 'single_lesson', 'package', 'monthly']

export async function POST(request) {
  const studentId = await getCurrentStudentId()
  if (!studentId) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const amount = Number(body?.amount)
  const type = body?.type
  const useCredit = Boolean(body?.useCredit)

  if (!Number.isFinite(amount) || amount <= 0 || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'A positive amount and valid type are required.' }, { status: 400 })
  }

  let creditApplied = 0
  if (useCredit) {
    creditApplied = await getMaxCreditRedemption({ studentId, amount, type })
  }

  const payableAmount = Math.round((amount - creditApplied) * 100) / 100
  const purchase = await recordPurchase({ studentId, amount, type })

  if (creditApplied > 0) {
    await redeemCredit({ studentId, purchaseId: purchase.id, amount: creditApplied })
  }

  return NextResponse.json({ purchase, creditApplied, payableAmount })
}
