import { VOUCHER_ORIGIN } from './config'
import { accessToken } from './security'
import type { VoucherOrder } from './types'

const baseUrl = () => process.env.PAYU_ENVIRONMENT === 'sandbox' ? 'https://secure.snd.payu.com' : 'https://secure.payu.com'

export function safeCheckoutUrl(value: string) {
  const url = new URL(value)
  return url.protocol === 'https:' && url.origin === baseUrl() ? url.href : null
}

async function payuToken() {
  const response = await fetch(`${baseUrl()}/pl/standard/user/oauth/authorize`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials',
      client_id: process.env.PAYU_CLIENT_ID!, client_secret: process.env.PAYU_CLIENT_SECRET! }),
  })
  const data = await response.json()
  if (!response.ok || typeof data.access_token !== 'string') throw new Error('PayU authorization failed')
  return data.access_token as string
}

export async function createPayuOrder(order: VoucherOrder, customerIp: string) {
  const names = order.buyer_name.split(/\s+/)
  const response = await fetch(`${baseUrl()}/api/v2_1/orders`, {
    method: 'POST', redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await payuToken()}` },
    body: JSON.stringify({
      notifyUrl: `${VOUCHER_ORIGIN}/api/vouchers/payu/notify`,
      continueUrl: `${VOUCHER_ORIGIN}/voucher/potwierdzenie#order=${order.id}&access=${accessToken(order.id)}`,
      customerIp, merchantPosId: process.env.PAYU_POS_ID,
      description: `uNick Academy — voucher ${order.value} zł Black Friday 2026`,
      currencyCode: 'PLN', totalAmount: String(order.cash_grosze), extOrderId: order.id,
      buyer: { email: order.buyer_email, firstName: names[0], lastName: names.slice(1).join(' ') || names[0], language: 'pl' },
      products: [{ name: `Voucher ${order.value} zł na zajęcia z native speakerami`, unitPrice: String(order.cash_grosze), quantity: '1' }],
    }),
  })
  const data = await response.json()
  const url = typeof data.redirectUri === 'string' ? safeCheckoutUrl(data.redirectUri) : null
  if (![200, 201, 302].includes(response.status) || data.status?.statusCode !== 'SUCCESS' || !url || typeof data.orderId !== 'string') {
    throw new Error('PayU checkout unavailable')
  }
  return { orderId: data.orderId as string, url }
}
