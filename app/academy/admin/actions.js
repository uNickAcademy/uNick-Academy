'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { SKILLS } from '@/lib/constants'

export async function createLessonPlan(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/academy/login')

  const title = formData.get('title')?.toString().trim()
  const description = formData.get('description')?.toString().trim() || null
  const cefrLevel = formData.get('cefr_level')
  const ageGroup = formData.get('age_group')
  const isFree = formData.get('is_free') === 'on'
  const skills = SKILLS.filter((skill) => formData.get(`skill_${skill}`) === 'on')
  const pdf = formData.get('pdf')

  if (!title || !cefrLevel || !ageGroup || !pdf || typeof pdf === 'string' || pdf.size === 0) {
    redirect('/academy/admin/new?error=' + encodeURIComponent('Please fill in all required fields and choose a PDF.'))
  }

  const safeName = pdf.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `lessons/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('lesson-plans')
    .upload(path, pdf, { contentType: 'application/pdf' })

  if (uploadError) {
    redirect('/academy/admin/new?error=' + encodeURIComponent(uploadError.message))
  }

  const { error: insertError } = await supabase.from('lesson_plans').insert({
    title,
    description,
    cefr_level: cefrLevel,
    age_group: ageGroup,
    skills,
    pdf_path: path,
    is_free: isFree,
  })

  if (insertError) {
    await supabase.storage.from('lesson-plans').remove([path])
    redirect('/academy/admin/new?error=' + encodeURIComponent(insertError.message))
  }

  revalidatePath('/academy/admin')
  revalidatePath('/academy/library')
  redirect('/academy/admin')
}
