import { NextResponse } from 'next/server'
import { VOUCHER_OFFERS, salesWindow, salesEnabled } from '@/lib/vouchers/config'
import { noStore } from '@/lib/vouchers/http'
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({ offers: VOUCHER_OFFERS, window: salesWindow(), available: salesEnabled() }, { headers: noStore })
}
