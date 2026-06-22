import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../auth/actions'
import UnicornMascot from './UnicornMascot'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin ?? false
  }

  return (
    <header className="bg-navy text-white sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/academy" className="flex items-center gap-2 font-heading font-bold text-lg shrink-0">
          <UnicornMascot className="h-8 w-8" />
          <span>uNick Teachers Academy</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm font-medium flex-wrap">
          <Link href="/academy/library" className="hover:text-sky">Library</Link>
          <Link href="/academy/pricing" className="hover:text-sky">Pricing</Link>
          {isAdmin && (
            <Link href="/academy/admin" className="hover:text-sky">Admin</Link>
          )}
          {user ? (
            <>
              <Link href="/academy/dashboard" className="hover:text-sky">Dashboard</Link>
              <Link href="/academy/talk-to-unickorn" className="hover:text-sky">uNickorn</Link>
              <Link href="/academy/account" className="hover:text-sky">Account</Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="bg-brand hover:bg-red-700 transition-colors rounded-full px-4 py-1.5"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/academy/login" className="hover:text-sky">Log in</Link>
              <Link
                href="/academy/signup"
                className="bg-brand hover:bg-red-700 transition-colors rounded-full px-4 py-1.5"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
