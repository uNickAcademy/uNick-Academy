import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { siteConfig } from '@/app/lib/site-config'

export const MATERIALS_COOKIE = 'unick_materials'
export const SESSION_SECONDS = 30 * 24 * 60 * 60
export const PRIVATE_PDF_BUCKET = 'lesson-material-pdfs'
export const NEWSLETTER_CONSENT_VERSION = '2026-11-18'
export const PRIVATE_RESPONSE_HEADERS = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' }

export const accessTokenPattern = /^[A-Za-z0-9_-]{43}$/
const unsubscribeTokenPattern = /^([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/

export function materialLocale(locale: unknown) {
  return locale === 'en' ? 'en' : 'pl'
}

function signature(purpose: string, input: string) {
  const secret = process.env.LESSON_MATERIALS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Lesson materials signing key is unavailable')
  return createHmac('sha256', secret).update(`lesson-materials/${purpose}/${input}`).digest('base64url')
}

function matchesSignature(actual: string, expected: string) {
  return accessTokenPattern.test(actual) && timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
}

export function createAccessToken() {
  return randomBytes(32).toString('base64url')
}

export function hashAccessToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function hashRequestClient(client: string) {
  return signature('request-ip', client)
}

export function createMaterialsSession() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS
  const value = `${expires}.${createAccessToken()}`
  return `${value}.${signature('session', value)}`
}

export async function hasMaterialsAccess() {
  const cookie = (await cookies()).get(MATERIALS_COOKIE)?.value
  const match = cookie?.match(/^(\d{10,12})\.([A-Za-z0-9_-]{43})\.([A-Za-z0-9_-]{43})$/)
  if (!match || Number(match[1]) <= Math.floor(Date.now() / 1000)) return false
  return matchesSignature(match[3], signature('session', `${match[1]}.${match[2]}`))
}

export function materialsActionUrl(action: 'confirm' | 'unsubscribe', locale: 'pl' | 'en', token: string) {
  const url = new URL(`/api/lesson-materials/${action}`, siteConfig.url)
  url.searchParams.set('lang', locale)
  url.hash = token
  return url.href
}

export function materialsUnsubscribeUrl(contactId: string, locale: 'pl' | 'en') {
  return materialsActionUrl('unsubscribe', locale, `${contactId}.${signature('unsubscribe', contactId)}`)
}

export function unsubscribeContactId(token: unknown) {
  const match = typeof token === 'string' && token.match(unsubscribeTokenPattern)
  if (!match || !matchesSignature(match[2], signature('unsubscribe', match[1]))) return null
  return match[1]
}
