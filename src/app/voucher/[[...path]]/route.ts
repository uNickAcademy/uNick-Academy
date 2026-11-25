import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { termsHtml } from '@/lib/vouchers/terms'

export const runtime = 'nodejs'
const publicPaths = new Set(['', 'potwierdzenie', 'zasady'])

/** Final storefront. Payments and private receipts are handled only by server APIs. */
export async function GET(_request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const segments = (await context.params).path ?? []
  const page = segments.join('/')
  if (page === 'email') return Response.redirect(new URL('/voucher', _request.url), 307)
  if (!publicPaths.has(page)) {
    return new Response('Nie znaleziono strony.', { status: 404 })
  }
  const template = await readFile(path.join(process.cwd(), 'public/voucher-preview/index.html'), 'utf8')
  const html = page === 'zasady' ? termsHtml() : template
    .replace('src="./app.js"', 'src="./checkout.js"')
    .replace(/<div class="preview-bar">[\s\S]*?<\/div>/, '<div class="preview-bar">BLACK FRIDAY · 27–30 listopada 2026 · Dla siebie lub na prezent</div>')
    .replace(/<dialog[\s\S]*?<\/dialog>/g, '')
    .replace(' — podgląd', '')
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
