import { randomBytes } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const DOWNLOAD_TTL_HOURS = 72
export const DOWNLOAD_MAX_USES = 5

/**
 * Mint fresh time-limited download tokens for digital order items.
 * The token maps to a row in tp_download_links; the actual file is only
 * ever served via a short-lived signed URL created at click time, so the
 * private bucket never leaks a permanent URL.
 */
export async function createDownloadLinks(
  supabase: SupabaseClient,
  items: { orderItemId: string; storagePath: string; productName: string }[],
  siteUrl: string
): Promise<{ name: string; url: string }[]> {
  const links: { name: string; url: string }[] = []
  for (const item of items) {
    const token = randomBytes(24).toString('base64url')
    const { error } = await supabase.from('tp_download_links').insert({
      order_item_id: item.orderItemId,
      token,
      storage_path: item.storagePath,
      expires_at: new Date(Date.now() + DOWNLOAD_TTL_HOURS * 3600_000).toISOString(),
      max_downloads: DOWNLOAD_MAX_USES,
    })
    if (error) {
      console.error('[TP downloads] link insert failed:', error)
      continue
    }
    links.push({ name: item.productName, url: `${siteUrl}/api/teenpreneurs/download/${token}` })
  }
  return links
}
