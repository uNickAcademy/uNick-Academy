import { NextRequest, NextResponse } from 'next/server'
import { createTpAdminClient } from '@/lib/teenpreneurs/supabase'

// Secure download: token → validity check → 5-minute signed URL from the
// private bucket. Expired/exhausted tokens land on the refresh page.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const supabase = createTpAdminClient()
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 503 })

  const { token } = await params

  const { data: link } = await supabase
    .from('tp_download_links')
    .select('id, storage_path, expires_at, download_count, max_downloads, order_item_id, tp_order_items(order_id, tp_orders(locale))')
    .eq('token', token)
    .maybeSingle()

  // Locale for the fallback page, if we can find it on the joined order.
  type JoinedOrder = { locale?: string } | { locale?: string }[] | null
  const joinedItem = link?.tp_order_items as { tp_orders?: JoinedOrder } | { tp_orders?: JoinedOrder }[] | null | undefined
  const item = Array.isArray(joinedItem) ? joinedItem[0] : joinedItem
  const orderRef = Array.isArray(item?.tp_orders) ? item?.tp_orders[0] : item?.tp_orders
  const locale = orderRef?.locale === 'pl' ? 'pl' : 'en'
  const refreshUrl = new URL(`/teenpreneurs/${locale}/downloads?expired=1`, req.nextUrl.origin)

  if (!link) return NextResponse.redirect(refreshUrl)
  if (new Date(link.expires_at).getTime() < Date.now()) return NextResponse.redirect(refreshUrl)
  if (link.download_count >= link.max_downloads) return NextResponse.redirect(refreshUrl)

  const { data: signed, error: signError } = await supabase.storage
    .from('tp-downloads')
    .createSignedUrl(link.storage_path, 300, { download: true })

  if (signError || !signed?.signedUrl) {
    // File missing in the bucket (not yet uploaded) — treat as expired.
    console.error('[TP download] signing failed:', signError)
    return NextResponse.redirect(refreshUrl)
  }

  await supabase
    .from('tp_download_links')
    .update({ download_count: link.download_count + 1 })
    .eq('id', link.id)

  return NextResponse.redirect(signed.signedUrl)
}
