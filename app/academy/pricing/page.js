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
    { plan: 'annual', label: 'Annual', price: PRICES.annual[currency], period: '/ year', badge: '2 months free' },
  ]

  return (
    <div className="max-w-[900px] mx-auto px-6 py-14 text-center">
      <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.18em] uppercase text-brand mb-3">Pricing</span>
      <h1 className="font-heading font-bold text-3xl sm:text-[2.2rem] text-navy mb-2 tracking-tight">Membership pricing</h1>
      <p className="text-muted mb-8 max-w-lg mx-auto">
        Unlimited access to the full lesson plan library, cancel anytime.
      </p>

      <div className="flex justify-center gap-2 mb-10 text-sm">
        {CURRENCIES.map((c) => (
          <Link
            key={c}
            href={`/academy/pricing?currency=${c}`}
            className={`rounded-full px-4 py-1.5 border transition-colors ${
              c === currency
                ? 'bg-navy text-white border-navy'
                : 'border-ui-border text-muted hover:border-navy hover:text-navy'
            }`}
          >
            {c.toUpperCase()}
          </Link>
        ))}
      </div>

      {subscriptionStatus === 'active' && (
        <div className="bg-cream border border-ui-border text-navy text-sm rounded-card px-5 py-4 mb-8 max-w-lg mx-auto">
          You already have an active membership. Manage it from your{' '}
          <Link href="/academy/account" className="font-semibold underline">account page</Link>.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {plans.map(({ plan, label, price, period, badge }) => (
          <div key={plan} className="bg-white border border-ui-border rounded-card p-7 shadow-card relative">
            {badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-4 py-1 rounded-full">
                {badge}
              </span>
            )}
            <h2 className="font-heading font-bold text-xl text-navy mb-2">{label}</h2>
            <p className="text-[2rem] font-bold text-navy mb-1 tracking-tight">
              {symbol}{price}
              <span className="text-base font-medium text-muted"> {period}</span>
            </p>
            <p className="text-xs text-muted mb-5">+ VAT where applicable</p>
            {user ? (
              subscriptionStatus === 'active' ? (
                <span className="block text-sm text-muted">Already subscribed</span>
              ) : (
                <form action="/academy/api/checkout" method="POST">
                  <input type="hidden" name="plan" value={plan} />
                  <input type="hidden" name="currency" value={currency} />
                  <button
                    type="submit"
                    className="w-full bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold text-[15px]"
                  >
                    Subscribe
                  </button>
                </form>
              )
            ) : (
              <Link
                href={`/academy/signup?redirect=${encodeURIComponent('/academy/pricing')}`}
                className="block w-full bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold text-[15px] text-center"
              >
                Sign up to subscribe
              </Link>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted mt-10 max-w-lg mx-auto">
        Prices shown are exclusive of VAT. Where VAT applies, it will be added at checkout
        based on your location. You can cancel your membership at any time from your account
        page.
      </p>
    </div>
  )
}
