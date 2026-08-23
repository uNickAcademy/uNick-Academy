import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MONTHS_PL } from '@/lib/billing/engine'

/**
 * Podstawa faktury dla firmy: ile lekcji jej pracowników odbyło się w danym
 * miesiącu i ile to kosztuje przy uzgodnionej stawce.
 *
 * Do tej pory kwotę na fakturze wpisywało się ręcznie, bez związku z tym, co
 * system wie o lekcjach. Przy kilkudziesięciu pracownikach oznaczało to
 * liczenie w arkuszu obok aplikacji, która ma te dane.
 *
 * Liczymy lekcje nieodwołane. Zajęcia grupowe pomijamy: te rozlicza abonament
 * grupy, a nie umowa z firmą.
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'reception'].includes(profile.role as string)) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  const params = new URL(req.url).searchParams
  const companyId = params.get('companyId') ?? ''
  const month = params.get('month') ?? '' // YYYY-MM

  if (!/^[0-9a-f-]{36}$/i.test(companyId)) {
    return NextResponse.json({ error: 'Nieprawidłowa firma' }, { status: 400 })
  }
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) {
    return NextResponse.json({ error: 'Podaj miesiąc w formacie RRRR-MM' }, { status: 400 })
  }

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (monthIndex < 0 || monthIndex > 11) {
    return NextResponse.json({ error: 'Nieprawidłowy miesiąc' }, { status: 400 })
  }

  const from = new Date(Date.UTC(year, monthIndex, 1)).toISOString()
  const to = new Date(Date.UTC(year, monthIndex + 1, 1)).toISOString()

  const [{ data: company }, { data: employees }] = await Promise.all([
    supabase.from('companies').select('name, rate_per_lesson').eq('id', companyId).single(),
    supabase.from('students').select('id').eq('company_id', companyId).is('deleted_at', null),
  ])

  if (!company) return NextResponse.json({ error: 'Nie znaleziono firmy' }, { status: 404 })

  const ids = (employees ?? []).map((e) => e.id)
  let lessons = 0
  if (ids.length > 0) {
    const { count } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .in('student_id', ids)
      .is('group_id', null)
      .is('cancelled_at', null)
      .gte('starts_at', from)
      .lt('starts_at', to)
    lessons = count ?? 0
  }

  const rate = company.rate_per_lesson != null ? Number(company.rate_per_lesson) : null
  const net = rate != null ? Math.round(lessons * rate * 100) / 100 : null

  return NextResponse.json({
    company: company.name,
    label: `${MONTHS_PL[monthIndex]} ${year}`,
    employees: ids.length,
    lessons,
    rate,
    net,
  })
}
