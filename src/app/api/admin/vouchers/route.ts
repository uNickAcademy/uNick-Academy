import { NextResponse } from 'next/server'
import { z } from 'zod'
import { voucherStaff } from '@/lib/vouchers/staff'
import { readSmallJson, sameOrigin, voucherError, noStore } from '@/lib/vouchers/http'
import { deliverVoucher } from '@/lib/vouchers/email'

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('reserve'), orderId: z.string().uuid(), release: z.boolean(), confirmed: z.literal(true) }).strict(),
  z.object({ action: z.literal('activation'), orderId: z.string().uuid(), clientId: z.string().regex(/^\d{1,16}$/), reference: z.string().trim().min(3).max(500), confirmed: z.literal(true) }).strict(),
  z.object({ action: z.literal('refund'), orderId: z.string().uuid(), reference: z.string().trim().min(3).max(500), reversal: z.string().trim().max(500), confirmed: z.literal(true) }).strict(),
  z.object({ action: z.literal('retry-email'), orderId: z.string().uuid() }).strict(),
])

export async function POST(request: Request) {
  if (!sameOrigin(request)) return voucherError('Otwórz panel na stronie szkoły.', 403)
  const staff = await voucherStaff()
  if (!staff) return voucherError('Zaloguj się na konto obsługi szkoły.', 403)
  let input
  try { input = actionSchema.parse(await readSmallJson(request)) } catch { return voucherError('Uzupełnij wymagane dane i potwierdzenie.') }
  try {
    if (input.action === 'retry-email') await deliverVoucher(input.orderId)
    else if (input.action === 'reserve') {
      const result = await staff.db.rpc('voucher_claim_activation', { p_order_id: input.orderId, p_actor: staff.user.id, p_release: input.release })
      if (result.error) return voucherError('Nie zmieniono rezerwacji. Voucher może być już aktywowany, nieważny lub obsługiwany przez inną osobę.', 409)
    } else if (input.action === 'activation') {
      const result = await staff.db.rpc('voucher_record_activation', { p_order_id: input.orderId, p_client_id: input.clientId, p_reference: input.reference, p_actor: staff.user.id })
      if (result.error) return voucherError('Nie zapisano aktywacji. Sprawdź, czy voucher jest opłacony, ważny i nie był już aktywowany.', 409)
    } else {
      if (staff.role !== 'admin') return voucherError('Zwrot może zapisać administrator.', 403)
      const result = await staff.db.rpc('voucher_record_refund', { p_order_id: input.orderId, p_payu_reference: input.reference, p_reversal_reference: input.reversal, p_actor: staff.user.id })
      if (result.error) return voucherError('Nie zapisano zwrotu. Sprawdź stan vouchera oraz referencje PayU i korekt w ActiveNow.', 409)
    }
    return NextResponse.json({ ok: true }, { headers: noStore })
  } catch { return voucherError('Nie udało się zakończyć tej czynności. Spróbuj ponownie za chwilę.', 503) }
}
