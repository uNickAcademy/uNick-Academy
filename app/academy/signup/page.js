import Link from 'next/link'
import Image from 'next/image'
import { signUp } from '../auth/actions'
import ConsentCheckboxes from '../../components/ConsentCheckboxes'
import { getDictionary } from '../../lib/dictionaries'

export default async function SignupPage({ searchParams }) {
  const params = await searchParams
  const error = params?.error
  const redirectTo = params?.redirect || '/academy/pricing'
  const dict = getDictionary('pl')

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center p-[3px] rounded-[10px] bg-cream border border-ui-border">
              <Image src="/brand/shield.png" alt="" width={22} height={28} />
            </span>
            <span className="font-heading font-bold text-xl tracking-tight text-navy">
              <span className="text-brand">uNick</span> Academy
            </span>
          </Link>
          <h1 className="font-heading font-bold text-[1.7rem] text-navy mt-5 mb-2 tracking-tight">
            Create your account
          </h1>
          <p className="text-muted text-[15px]">
            Sign up for free, then subscribe to unlock the full lesson plan library.
          </p>
        </div>

        {error && (
          <p className="bg-brand-soft text-brand text-sm rounded-2xl px-4 py-3 mb-4">{error}</p>
        )}

        <form
          action={signUp}
          className="bg-white border border-ui-border rounded-card p-7 flex flex-col gap-5 shadow-card"
        >
          <input type="hidden" name="redirect" value={redirectTo} />
          <div>
            <label className="block text-[13px] font-semibold text-navy mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border-[1.5px] border-ui-border px-4 py-2.5 text-[15px] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-navy mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-xl border-[1.5px] border-ui-border px-4 py-2.5 text-[15px] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition-colors"
            />
          </div>
          <div className="mt-2">
            <ConsentCheckboxes locale="pl" dict={dict} showMarketing />
          </div>
          <button
            type="submit"
            className="w-full bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold text-[15px] mt-1"
          >
            Sign up
          </button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-navy font-semibold hover:text-brand transition-colors">
            Log in
          </Link>
        </p>
        <p className="text-center mt-3">
          <Link href="/en" className="text-[13px] text-muted hover:text-navy transition-colors">
            &larr; Back to homepage
          </Link>
        </p>
      </div>
    </div>
  )
}
