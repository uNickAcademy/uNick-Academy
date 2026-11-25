import sharp from 'sharp'
import { createVoucherSvg } from '../../../public/voucher-preview/voucher.js'
import type { VoucherOrder } from './types'
import { outlineVoucherText } from './outline-text'

export function expiryLabel(expiresOn: string) {
  const [year, month, day] = expiresOn.slice(0, 10).split('-')
  return `${day}.${month}.${year}`
}

export async function renderVoucher(order: VoucherOrder) {
  if (order.status !== 'paid' || !order.voucher_code || !order.expires_on) throw new Error('Voucher not issued')
  const svg = createVoucherSvg({ value: order.value, code: order.voucher_code,
    validUntil: expiryLabel(order.expires_on), demo: false })
  return sharp(Buffer.from(await outlineVoucherText(svg))).png().toBuffer()
}
