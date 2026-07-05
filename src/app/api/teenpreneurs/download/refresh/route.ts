import { NextRequest, NextResponse } from 'next/server'
import { createTpAdminClient } from '@/lib/teenpreneurs/supabase'
import { createDownloadLinks } from '@/lib/teenpreneurs/downloads'
import { findVariant } from '@/lib/teenpreneurs/products'
import { sendTpDownloadLinks } from '@/lib/teenpreneurs/email'

// Re-issue download links for all paid digital purchases of an email.
// Always answers success so the endpoint can't be used to probe which
// addresses have ordered ("account enumeration").
export async function POST(req: NextRequest) {
  const supabase = createTpAdminClient()
  if (!supabase) return NextResponse.json({ error: 'not configured' }, { status: 503 })

  const { email, locale = 'en' } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'missing email' }, { status: 400 })
  const normalized = String(email).trim().toLowerCase()

  const { data: orders } = await supabase
    .from('tp_orders')
    .select('id, locale, tp_order_items(id, product_name, variant_id, is_digital)')
    .eq('email', normalized)
    .eq('status', 'paid')

  const digital = (orders ?? []).flatMap(order =>
    (order.tp_order_items ?? [])
      .filter(item => item.is_digital)
      .map(item => ({
        orderItemId: item.id,
        productName: item.product_name,
        storagePath: findVariant(item.variant_id)?.variant.storagePath ?? null,
      }))
      .filter((i): i is { orderItemId: string; productName: string; storagePath: string } => !!i.storagePath)
  )

  if (digital.length > 0) {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
    const links = await createDownloadLinks(supabase, digital, siteUrl)
    if (links.length > 0) {
      await sendTpDownloadLinks({ to: normalized, locale, downloads: links })
    }
  }

  return NextResponse.json({ success: true })
}
