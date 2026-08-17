import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { timeoutFetch } from '@/lib/supabase/fetch'

// Middleware siedzi przed każdym żądaniem, więc nie może czekać długo —
// gdy Supabase nie odpowiada, lepiej szybki błąd niż zamrożona strona.
const MIDDLEWARE_TIMEOUT_MS = 6_000

export async function middleware(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  const studentPaths = ['/dashboard', '/lekcje', '/postepy', '/polecenia', '/platnosci', '/rozliczenia', '/profil']
  const teacherPaths = ['/nauczyciel/']
  const adminPaths = ['/admin', '/ufos']
  const hrPaths = ['/firma']
  const protectedPaths = [...studentPaths, ...teacherPaths, ...adminPaths, ...hrPaths]

  const path = req.nextUrl.pathname
  const isProtected = protectedPaths.some(p => path.startsWith(p))

  // Strony publiczne (marketing, cennik, kreator zapisów) nie potrzebują sesji.
  // Wcześniej każde wejście na dowolny adres pytało Supabase o użytkownika, więc
  // awaria Supabase kładła całą witrynę — także podstrony, które z logowaniem
  // nie mają nic wspólnego. Przy okazji to spory ubytek ruchu do bazy.
  if (!isProtected) {
    return NextResponse.next({ request: { headers: req.headers } })
  }

  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { fetch: timeoutFetch(MIDDLEWARE_TIMEOUT_MS) },
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'student'

  const otherRolePath = (allowed: string[]) => !allowed.some(p => path.startsWith(p))

  if (role === 'student' && otherRolePath(studentPaths)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // B2B employees (billing_type='b2b') cannot access payment pages
  if (role === 'student' && (path.startsWith('/platnosci') || path.startsWith('/rozliczenia'))) {
    const { data: student } = await supabase
      .from('students')
      .select('billing_type')
      .eq('profile_id', user.id)
      .single()
    if (student?.billing_type === 'b2b') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }
  if (role === 'teacher' && otherRolePath(teacherPaths)) {
    return NextResponse.redirect(new URL('/nauczyciel/dashboard', req.url))
  }
  if (role === 'hr' && otherRolePath(hrPaths)) {
    return NextResponse.redirect(new URL('/firma/dashboard', req.url))
  }
  if (role === 'reception' && otherRolePath(adminPaths)) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }
  // Admin ma dostęp wszędzie, ale nie ma kartoteki ucznia — panel ucznia
  // wyświetliłby mu się pusty. /dashboard jest lądowiskiem po zalogowaniu,
  // więc admina trzeba stąd odesłać do jego panelu.
  if (role === 'admin' && path === '/dashboard') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }

  return res
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
