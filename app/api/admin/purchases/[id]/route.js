import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { updatePurchaseStatus } from '@/lib/referrals'

const VALID_STATUSES = ['paid', 'refunded', 'cancelled']

export async function PATCH(request, { params }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const status = body?.status

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'status must be paid, refunded, or cancelled.' }, { status: 400 })
  }

  const purchase = await updatePurchaseStatus({ purchaseId: id, status })
  return NextResponse.json({ purchase })
}
