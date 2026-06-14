'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(formData) {
  const email = formData.get('email')
  const password = formData.get('password')
  const redirectTo = formData.get('redirect') || '/academy/library'

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/academy/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect(redirectTo)
}

export async function signIn(formData) {
  const email = formData.get('email')
  const password = formData.get('password')
  const redirectTo = formData.get('redirect') || '/academy/library'

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/academy/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect(redirectTo)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/academy')
}
