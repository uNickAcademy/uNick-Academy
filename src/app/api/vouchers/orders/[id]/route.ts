import { NextResponse } from 'next/server'
import { authorizedOrder, noStore, voucherError } from '@/lib/vouchers/http'

export const runtime = 'nodejs'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const order = await authorizedOrder(request, (await context.params).id)
    if (!order) return voucherError('Nie znaleziono zamówienia. Otwórz ponownie link z potwierdzenia.', 404)
    return NextResponse.json({ id: order.id, status: order.status, value: order.value,
      price: order.cash_grosze / 100, bonus: order.bonus_grosze / 100,
      code: order.status === 'paid' ? order.voucher_code : null,
      expiresOn: order.expires_on, emailSent: Boolean(order.email_sent_at), gift: order.gift,
    }, { headers: noStore })
  } catch { return voucherError('Nie możemy teraz sprawdzić płatności. Odśwież stronę za chwilę.', 503) }
}
