import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Tworzy konto HR (kontakt firmowy) przez funkcję SECURITY DEFINER (omija walidator GoTrue)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })

  const { fullName, email, phone, companyId } = await req.json()
  if (!fullName || !email || !companyId) {
    return NextResponse.json({ error: 'Imię, email i firma są wymagane' }, { status: 400 })
  }

  const { data: tempPassword, error } = await supabase.rpc('admin_create_hr', {
    p_email: email, p_full_name: fullName, p_phone: phone || '', p_company: companyId,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, tempPassword })
}
