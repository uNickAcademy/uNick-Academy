import { headers } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CURRENCIES, CURRENCY_SYMBOLS, PRICES, currencyForCountry } from '@/lib/constants'

export default async function PricingPage({ searchParams }) {
  const params = await searchParams
  const hdrs = await headers()
  const detected = currencyForCountry(hdrs.get('x-vercel-ip-country'))
  const currency = CURRENCIES.includes(params?.currency) ? params.currency : detected

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let subscriptionStatus = 'none'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()
    subscriptionStatus = profile?.subscription_status ?? 'none'
  }

  const symbol = CURRENCY_SYMBOLS[currency]
  const plans = [
    { plan: 'monthly', label: 'Monthly', price: PRICES.monthly[currency], period: '/ month' },
    { plan: 'annual', label: 'Annual', price: PRICES.annual[currency], period: '/ year' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-center">
      <h1 className="font-heading font-bold text-3xl text-navy mb-2">Membership pricing</h1>
      <p className="text-slate-600 mb-6">
        Unlimited access to the full lesson plan library, cancel anytime.
      </p>

      <div className="flex justify-center gap-2 mb-8 text-sm">
        {CURRENCIES.map((c) => (
          <Link
            key={c}
            href={`/academy/pricing?currency=${c}`}
            className={`rounded-full px-4 py-1.5 border ${
              c === currency ? 'bg-navy text-white border-navy' : 'border-slate-300 text-slate-600 hover:border-navy'
            }`}
          >
            {c.toUpperCase()}
          </Link>
        ))}
      </div>

      {subscriptionStatus === 'active' && (
        <p className="bg-sky/10 text-navy text-sm rounded-lg px-4 py-3 mb-6">
          You already have an active membership. Manage it from your{' '}
          <Link href="/academy/account" className="font-semibold underline">account page</Link>.
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {plans.map(({ plan, label, price, period }) => (
          <div key={plan} className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="font-heading font-bold text-xl text-navy mb-1">{label}</h2>
            <p className="text-3xl font-extrabold text-navy mb-1">
              {symbol}{price}
              <span className="text-base font-medium text-slate-500"> {period}</span>
            </p>
            {plan === 'annual' && (
              <p className="text-sm text-sky-700 mb-4">2 months free vs. monthly</p>
            )}
            {plan === 'monthly' && <p className="mb-4" />}
            {user ? (
              subscriptionStatus === 'active' ? (
                <span className="block text-sm text-slate-400">Already subscribed</span>
              ) : (
                <form action="/academy/api/checkout" method="POST">
                  <input type="hidden" name="plan" value={plan} />
                  <input type="hidden" name="currency" value={currency} />
                  <button
                    type="submit"
                    className="w-full bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold"
                  >
                    Subscribe
                  </button>
                </form>
              )
            ) : (
              <Link
                href={`/academy/signup?redirect=${encodeURIComponent('/academy/pricing')}`}
                className="block w-full bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold"
              >
                Sign up to subscribe
              </Link>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-8">
        Prices shown include VAT where applicable. You can cancel your membership at any time
        from your account page.
      </p>
    </div>
  )
}
