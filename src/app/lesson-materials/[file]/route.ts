import { NextRequest, NextResponse } from 'next/server'
import { lessonMaterials } from '@/app/lib/lesson-materials'
import { createAdminClient } from '@/lib/supabase/server'
import { hasMaterialsAccess, materialLocale, PRIVATE_PDF_BUCKET, PRIVATE_RESPONSE_HEADERS } from '@/lib/lesson-materials/access'

export async function GET(request: NextRequest, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params
  const material = lessonMaterials.find(({ slug }) => file === `${slug}.pdf`)
  if (!material) return new Response(null, { status: 404, headers: PRIVATE_RESPONSE_HEADERS })
  const language = materialLocale(request.nextUrl.searchParams.get('lang'))
  const preview = new URL(`/${language}/meterials/${material.slug}`, request.url)
  if (!await hasMaterialsAccess()) {
    return NextResponse.redirect(preview, { status: 307, headers: PRIVATE_RESPONSE_HEADERS })
  }
  const { data, error } = await createAdminClient().storage.from(PRIVATE_PDF_BUCKET).createSignedUrl(file, 300)
  if (!data || error) {
    console.error('Lesson materials PDF unavailable', file)
    preview.searchParams.set('pdf', 'unavailable')
    return NextResponse.redirect(preview, { status: 307, headers: PRIVATE_RESPONSE_HEADERS })
  }
  return NextResponse.redirect(data.signedUrl, { status: 307, headers: PRIVATE_RESPONSE_HEADERS })
}
