import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Autoryzacja: tylko admin (funkcja RPC dodatkowo weryfikuje rolę)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'reception'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })

  const { fullName, email, phone, level, teacherId } = await req.json()
  if (!fullName || !email) {
    return NextResponse.json({ error: 'Imię i email są wymagane' }, { status: 400 })
  }

  // Tworzymy konto bezpośrednio przez funkcję SECURITY DEFINER (omija walidator GoTrue,
  // tak samo jak konta zakładane w migracjach – logowanie hasłem działa)
  const { data: tempPassword, error } = await supabase.rpc('admin_create_student', {
    p_email: email,
    p_full_name: fullName,
    p_phone: phone || '',
    p_level: level || 'A1',
    p_teacher: teacherId || null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, tempPassword })
}
