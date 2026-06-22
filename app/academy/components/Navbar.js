import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../auth/actions'

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
      <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center justify-between gap-6 flex-wrap">
        <Link href="/academy" className="flex items-center gap-2.5 shrink-0">
          <span className="inline-flex items-center justify-center p-[3px] rounded-[10px] bg-white/10 border border-white/20">
            <Image src="/brand/shield.png" alt="" width={22} height={28} />
          </span>
          <span className="font-heading font-bold text-lg tracking-tight">
            <span className="text-brand-bright">uNick</span> Academy
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-[13.5px] font-medium flex-wrap">
          <Link href="/academy/library" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
            Library
          </Link>
          <Link href="/academy/pricing" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
            Pricing
          </Link>
          {isAdmin && (
            <Link href="/academy/admin" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
              Admin
            </Link>
          )}
          {user ? (
            <>
              <Link href="/academy/dashboard" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
                Dashboard
              </Link>
              <Link href="/academy/talk-to-unickorn" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
                uNickorn
              </Link>
              <Link href="/academy/account" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
                Account
              </Link>
              <form action={signOut} className="ml-1">
                <button
                  type="submit"
                  className="bg-brand hover:bg-red-700 transition-colors rounded-full px-5 py-1.5 text-[13px] font-semibold"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
                Log in
              </Link>
              <Link
                href="/academy/signup"
                className="ml-1 bg-brand hover:bg-red-700 transition-colors rounded-full px-5 py-1.5 text-[13px] font-semibold"
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
