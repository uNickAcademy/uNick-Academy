import { NextResponse } from 'next/server'
import { validAccess } from './security'
import { createAdminClient } from '@/lib/supabase/server'
import type { VoucherOrder } from './types'
import { VOUCHER_ORIGIN } from './config'

export const noStore = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex' }
export const voucherError = (message: string, status = 400) => NextResponse.json({ error: message }, { status, headers: noStore })

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (origin === VOUCHER_ORIGIN) return true
  if (process.env.NODE_ENV !== 'development') return false
  const port = new URL(request.url).port
  return origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`
}

export async function readSmallJson(request: Request, maxBytes = 12000) {
  if (Number(request.headers.get('content-length')) > maxBytes) throw new Error('Request too large')
  const body = await request.text()
  if (Buffer.byteLength(body) > maxBytes) throw new Error('Request too large')
  return JSON.parse(body) as unknown
}

export async function authorizedOrder(request: Request, orderId: string) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  if (!validAccess(orderId, token)) return null
  const result = await createAdminClient().from('voucher_orders').select('*').eq('id', orderId).maybeSingle()
  if (result.error) throw new Error('Order lookup unavailable')
  return result.data as VoucherOrder | null
}
