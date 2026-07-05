import Link from 'next/link'
import type { TpDictionary, TpLocale } from '@/lib/teenpreneurs/i18n'

export function TpFooter({ locale, dict }: { locale: TpLocale; dict: TpDictionary }) {
  const base = `/teenpreneurs/${locale}`
  const f = dict.common.footer

  const explore = [
    { href: `${base}/program`, label: dict.common.nav.program },
    { href: `${base}/differentability`, label: dict.common.nav.differentability },
    { href: `${base}/parents`, label: dict.common.nav.parents },
    { href: `${base}/event`, label: dict.common.nav.event },
    { href: `${base}/shop`, label: dict.common.nav.shop },
    { href: `${base}/enrol`, label: dict.common.nav.enrol },
  ]
  const legal = [
    { href: `${base}/contact`, label: f.contact },
    { href: `${base}/privacy`, label: f.privacy },
    { href: `${base}/terms`, label: f.terms },
    { href: `${base}/refunds`, label: f.refunds },
  ]

  return (
    <footer className="bg-tp-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-tp-display text-2xl font-bold">
            Teen<span className="text-tp-coral">preneurs</span>
          </p>
          <p className="mt-2 font-tp-editorial text-lg italic text-tp-sun">{f.tagline}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">{f.blurb}</p>
        </div>
        <nav aria-label={f.explore}>
          <h2 className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sky">{f.explore}</h2>
          <ul className="mt-4 space-y-2">
            {explore.map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-white/80 hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={f.legal}>
          <h2 className="font-tp-display text-sm font-semibold uppercase tracking-wider text-tp-sky">{f.legal}</h2>
          <ul className="mt-4 space-y-2">
            {legal.map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-white/80 hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/50 sm:px-6">
          © {new Date().getFullYear()} {f.company}. {f.rights}
        </p>
      </div>
    </footer>
  )
}
