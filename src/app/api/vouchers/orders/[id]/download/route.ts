import { authorizedOrder, noStore, voucherError } from '@/lib/vouchers/http'
import { renderVoucher } from '@/lib/vouchers/artwork'

export const runtime = 'nodejs'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const order = await authorizedOrder(request, (await context.params).id)
    if (!order || order.status !== 'paid') return voucherError('Voucher będzie dostępny po potwierdzeniu płatności.', 404)
    const png = await renderVoucher(order)
    return new Response(new Uint8Array(png), { headers: { ...noStore,
      'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="uNick-Academy-voucher-${order.value}.png"` } })
  } catch { return voucherError('Nie udało się pobrać vouchera. Spróbuj ponownie za chwilę.', 503) }
}
