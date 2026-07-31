import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifySchoolSms } from '@/lib/sms/send'
import { notifySchoolEmail } from '@/lib/email/send'

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

  // Zapytania B2B nie trafiały wcześniej ani na dzwonek, ani na maila —
  // jedynym kanałem był SMS, który wymaga osobnego tokenu.
  await admin.from('admin_notifications').insert({
    kind: 'b2b',
    title: `Nowe zapytanie B2B: ${companyName.trim()}`,
    body: `${contactName ? `${contactName}, ` : ''}${phone ? `tel. ${phone}, ` : ''}${email.trim()}${employeesCount ? ` · ${employeesCount} os.` : ''}`,
  }).then(undefined, (e: unknown) => console.error('[B2B] notify error:', e))

  await notifySchoolSms(`Nowe zapytanie B2B: ${companyName.trim()}${contactName ? `, ${contactName}` : ''}${phone ? `, tel. ${phone}` : ''}, ${email.trim()}`)
  await notifySchoolEmail({
    title: `Nowe zapytanie B2B: ${companyName.trim()}`,
    lines: [
      `Firma: ${companyName.trim()}`,
      contactName ? `Osoba kontaktowa: ${contactName}` : '',
      phone ? `Telefon: ${phone}` : '',
      `E-mail: ${email.trim()}`,
      employeesCount ? `Liczba pracowników: ${employeesCount}` : '',
      goal ? `Cel: ${goal}` : '',
    ],
    actionLabel: 'Otwórz pipeline →',
    actionPath: '/admin/pipeline',
  })
  return NextResponse.json({ success: true })
}
