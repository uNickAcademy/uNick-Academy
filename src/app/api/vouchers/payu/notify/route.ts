import { createAdminClient } from '@/lib/supabase/server'
import { notificationSchema } from '@/lib/vouchers/validation'
import { verifyPayuSignature, voucherCode } from '@/lib/vouchers/security'
import { deliverVoucher } from '@/lib/vouchers/email'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const key = process.env.PAYU_SECOND_KEY
  if (!key || !process.env.PAYU_POS_ID) return new Response('Not configured', { status: 503 })
  if (Number(request.headers.get('content-length')) > 100000) return new Response('Too large', { status: 413 })
  const body = await request.text()
  if (Buffer.byteLength(body) > 100000) return new Response('Too large', { status: 413 })
  if (!verifyPayuSignature(body, request.headers.get('openpayu-signature') || request.headers.get('x-openpayu-signature'), key)) return new Response('Unauthorized', { status: 401 })
  const parsed = notificationSchema.safeParse((() => { try { return JSON.parse(body) } catch { return null } })())
  if (!parsed.success || parsed.data.order.merchantPosId !== process.env.PAYU_POS_ID) return new Response('Invalid order', { status: 400 })
  const notification = parsed.data.order
  try {
    const db = createAdminClient()
    const result = await db.from('voucher_orders').select('*').eq('id', notification.extOrderId).single()
    const order = result.data
    if (result.error || !order || order.cash_grosze !== Number(notification.totalAmount) ||
      (order.payu_order_id && order.payu_order_id !== notification.orderId)) return new Response('Order mismatch', { status: 409 })
    if (notification.status === 'COMPLETED') {
      const paid = await db.rpc('voucher_complete_payment', { p_order_id: order.id, p_payu_order_id: notification.orderId,
        p_amount: Number(notification.totalAmount), p_code: voucherCode() })
      if (paid.error) throw new Error('Payment persistence failed')
      if (paid.data?.status === 'paid') await deliverVoucher(order.id)
    } else if (notification.status === 'CANCELED') {
      const canceled = await db.from('voucher_orders').update({ status: 'canceled', payu_order_id: notification.orderId }).eq('id', order.id).eq('status', 'pending')
      if (canceled.error) throw new Error('Cancel persistence failed')
    } else if (!order.payu_order_id) {
      const pending = await db.from('voucher_orders').update({ payu_order_id: notification.orderId }).eq('id', order.id).is('payu_order_id', null)
      if (pending.error) throw new Error('Payment reference persistence failed')
    }
    return new Response('OK', { status: 200 })
  } catch {
    // Non-200 intentionally asks PayU to retry. Never acknowledge an unpersisted payment or lost email.
    console.error('[Vouchers] Payment notification requires retry')
    return new Response('Retry later', { status: 503 })
  }
}
