import Link from 'next/link'
import { signUp } from '../auth/actions'

export default async function SignupPage({ searchParams }) {
  const params = await searchParams
  const error = params?.error
  const redirectTo = params?.redirect || '/academy/pricing'

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-heading font-bold text-2xl text-navy mb-2 text-center">Create your account</h1>
      <p className="text-sm text-slate-600 text-center mb-6">
        Sign up for free, then subscribe to unlock the full lesson plan library.
      </p>

      {error && (
        <p className="bg-red-50 text-brand text-sm rounded-lg px-4 py-3 mb-4">{error}</p>
      )}

      <form action={signUp} className="space-y-4">
        <input type="hidden" name="redirect" value={redirectTo} />
        <div>
          <label className="block text-sm font-medium text-navy mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold"
        >
          Sign up
        </button>
      </form>

      <p className="text-sm text-slate-600 text-center mt-6">
        Already have an account?{' '}
        <Link href="/academy/login" className="text-navy font-semibold hover:text-sky">
          Log in
        </Link>
      </p>
    </div>
  )
}
