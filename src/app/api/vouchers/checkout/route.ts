import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkoutSchema } from '@/lib/vouchers/validation'
import { offerFor, salesEnabled, VOUCHER_TERMS_VERSION } from '@/lib/vouchers/config'
import { accessToken, requestFingerprint, sha256 } from '@/lib/vouchers/security'
import { createPayuOrder } from '@/lib/vouchers/payu'
import { noStore, readSmallJson, sameOrigin, voucherError } from '@/lib/vouchers/http'
import type { VoucherOrder } from '@/lib/vouchers/types'

export const runtime = 'nodejs'
export const maxDuration = 60

function existingResponse(order: VoucherOrder) {
  if (order.status === 'paid') return NextResponse.json({ confirmationUrl: `/voucher/potwierdzenie#order=${order.id}&access=${accessToken(order.id)}` }, { headers: noStore })
  if (order.checkout_url && order.status === 'pending') return NextResponse.json({ checkoutUrl: order.checkout_url }, { headers: noStore })
  return voucherError('Przygotowujemy Twoją płatność. Spróbuj ponownie za chwilę. Jeśli problem się powtarza, napisz do nas.', 409)
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return voucherError('Otwórz formularz na stronie uNick Academy.', 403)
  if (!salesEnabled()) return voucherError('Sprzedaż voucherów jest dostępna 27–30 listopada. Jeśli trwa promocja, spróbuj ponownie za chwilę.', 503)
  let input
  try { input = checkoutSchema.parse(await readSmallJson(request)) } catch { return voucherError('Sprawdź imię, e-mail, wybrany voucher i akceptację zasad.') }
  try {
    const db = createAdminClient()
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
    const limit = await db.rpc('voucher_allow_checkout', { p_fingerprint: requestFingerprint(ip) })
    if (limit.error) throw new Error('Checkout limiter unavailable')
    if (!limit.data) return voucherError('Wysłano wiele prób zakupu. Spróbuj później lub skontaktuj się z nami.', 429)
    const requestHash = sha256(JSON.stringify(input))
    const previous = await db.from('voucher_orders').select('*').eq('idempotency_key', input.idempotencyKey).maybeSingle()
    if (previous.error) throw new Error('Checkout lookup failed')
    if (previous.data) {
      if (previous.data.request_hash !== requestHash) return voucherError('Dane zamówienia się zmieniły. Odśwież formularz i spróbuj ponownie.', 409)
      return existingResponse(previous.data as VoucherOrder)
    }
    const offer = offerFor(input.value)!
    const inserted = await db.from('voucher_orders').insert({ id: randomUUID(),
      idempotency_key: input.idempotencyKey, request_hash: requestHash,
      buyer_name: input.buyerName, buyer_email: input.buyerEmail, gift: input.gift, invoice: input.invoice ?? null,
      value: offer.value, cash_grosze: offer.cash, bonus_grosze: offer.bonus, face_grosze: offer.face,
      terms_version: VOUCHER_TERMS_VERSION,
    }).select('*').single()
    // A competing click may have inserted the same idempotency key first.
    if (inserted.error?.code === '23505') return voucherError('Twoja płatność jest już przygotowywana. Spróbuj ponownie za chwilę.', 409)
    if (inserted.error || !inserted.data) throw new Error('Order persistence failed')
    const order = inserted.data as VoucherOrder
    const checkout = await createPayuOrder(order, ip)
    const saved = await db.from('voucher_orders').update({ payu_order_id: checkout.orderId, checkout_url: checkout.url }).eq('id', order.id)
    if (saved.error) throw new Error('Checkout persistence failed')
    return NextResponse.json({ checkoutUrl: checkout.url }, { status: 201, headers: noStore })
  } catch {
    console.error('[Vouchers] Checkout could not be prepared')
    return voucherError('Nie udało się otworzyć płatności. Nie pobraliśmy pieniędzy w tym formularzu. Spróbuj później lub napisz na hello@unick-academy.pl.', 503)
  }
}
