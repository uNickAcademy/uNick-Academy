import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request, { params }) {
  const { id } = await params
  const supabase = await createClient()

  // RLS on lesson_plans already enforces: free lessons are visible to
  // everyone, paid lessons only to active subscribers.
  const { data: lesson } = await supabase
    .from('lesson_plans')
    .select('id, pdf_path')
    .eq('id', id)
    .maybeSingle()

  if (!lesson) {
    return NextResponse.json(
      { error: 'Lesson not found, or your subscription is not active.' },
      { status: 404 }
    )
  }

  const admin = createAdminClient()
  const { data: signed, error } = await admin.storage
    .from('lesson-plans')
    .createSignedUrl(lesson.pdf_path, 60)

  if (error || !signed) {
    return NextResponse.json({ error: 'Unable to generate download link.' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
