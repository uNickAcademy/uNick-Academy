'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function adjustCredit(studentId: string, amount: number, description: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Brak autoryzacji' }
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'reception'].includes(prof?.role ?? '')) return { error: 'Brak uprawnień' }
  if (!amount || Number.isNaN(amount)) return { error: 'Podaj kwotę' }

  // Dodatnia kwota = kredyt, ujemna = obciążenie; saldo przelicza trigger
  const { error } = await supabase.from('transactions').insert({
    student_id: studentId,
    type: amount >= 0 ? 'credit' : 'charge',
    amount: Math.abs(amount),
    description: description || 'Korekta kredytu (admin)',
  })
  if (error) return { error: 'Nie udało się zapisać korekty' }

  revalidatePath('/admin/polecenia')
  return { success: true }
}
