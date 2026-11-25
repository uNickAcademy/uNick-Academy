import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'
const previewPaths = new Set(['', 'email', 'potwierdzenie'])

/** Public design preview only: no payment, email or customer-ledger endpoint. */
export async function GET(_request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const segments = (await context.params).path ?? []
  if (!previewPaths.has(segments.join('/'))) {
    return new Response('Nie znaleziono strony.', { status: 404 })
  }
  const html = await readFile(path.join(process.cwd(), 'public/voucher-preview/index.html'), 'utf8')
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  })
}
