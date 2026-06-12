import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Publiczny formularz zapytań B2B → tworzy leada w pipeline (etap 'approach')
export async function POST(req: NextRequest) {
  const { companyName, contactName, email, phone, employeesCount, goal } = await req.json()
  if (!companyName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Nazwa firmy i email są wymagane.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('b2b_leads').insert({
    company_name: companyName.trim(),
    contact_name: contactName || null,
    email: email.trim(),
    phone: phone || null,
    employees_count: employeesCount ? Number(employeesCount) : null,
    goal: goal || null,
    stage: 'approach',
    source: 'formularz www',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
