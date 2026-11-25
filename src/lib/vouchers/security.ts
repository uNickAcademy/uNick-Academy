import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

function secret() {
  const value = process.env.VOUCHER_ACCESS_SECRET
  if (!value || value.length < 40) throw new Error('Voucher access configuration unavailable')
  return value
}

export function accessToken(orderId: string) {
  return createHmac('sha256', secret()).update(`voucher-order:${orderId}`).digest('base64url')
}

export function validAccess(orderId: string, token: string) {
  if (!/^[a-f\d-]{36}$/i.test(orderId) || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false
  const expected = Buffer.from(accessToken(orderId))
  const supplied = Buffer.from(token)
  return expected.length === supplied.length && timingSafeEqual(expected, supplied)
}

export function requestFingerprint(ip: string) {
  return createHmac('sha256', secret()).update(`checkout-ip:${ip}`).digest('hex')
}

export function voucherCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const code = [...randomBytes(16)].map(value => alphabet[value % alphabet.length]).join('')
  return `UNICK-${code.match(/.{4}/g)!.join('-')}`
}

export function verifyPayuSignature(body: string, header: string | null, secondKey: string) {
  if (!header || !secondKey) return false
  const parts = Object.fromEntries(header.split(';').map(part => {
    const [key, ...value] = part.trim().split('=')
    return [key.toLowerCase(), value.join('=')]
  }))
  if (parts.algorithm?.toUpperCase() !== 'MD5' || !/^[a-f\d]{32}$/i.test(parts.signature ?? '')) return false
  const expected = createHash('md5').update(body + secondKey, 'utf8').digest()
  return timingSafeEqual(expected, Buffer.from(parts.signature, 'hex'))
}
