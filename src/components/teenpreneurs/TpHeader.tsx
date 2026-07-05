'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, ShoppingBag } from 'lucide-react'
import clsx from 'clsx'
import type { TpDictionary, TpLocale } from '@/lib/teenpreneurs/i18n'
import { useCart } from './CartProvider'
import { TpButton } from './TpButton'

export function TpHeader({ locale, dict }: { locale: TpLocale; dict: TpDictionary }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { count } = useCart()
  const base = `/teenpreneurs/${locale}`

  const links = [
    { href: `${base}/program`, label: dict.common.nav.program },
    { href: `${base}/differentability`, label: dict.common.nav.differentability },
    { href: `${base}/parents`, label: dict.common.nav.parents },
    { href: `${base}/event`, label: dict.common.nav.event },
    { href: `${base}/shop`, label: dict.common.nav.shop },
  ]

  const otherLocale: TpLocale = locale === 'pl' ? 'en' : 'pl'
  const switchHref = pathname
    ? pathname.replace(`/teenpreneurs/${locale}`, `/teenpreneurs/${otherLocale}`)
    : `/teenpreneurs/${otherLocale}`

  function switchLocale() {
    // Remember the choice for the /teenpreneurs root redirect.
    document.cookie = `tp_locale=${otherLocale};path=/teenpreneurs;max-age=31536000;samesite=lax`
  }

  return (
    <header className="sticky top-0 z-40 border-b border-tp-navy/10 bg-tp-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={base} className="flex items-baseline gap-1 font-tp-display text-xl font-bold text-tp-navy">
          Teen<span className="text-tp-coral">preneurs</span>
          <span aria-hidden className="ml-1 hidden rotate-[-4deg] rounded bg-tp-sun px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-block">
            beta
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'font-tp-display text-sm font-medium transition-colors hover:text-tp-coral',
                pathname?.startsWith(l.href) ? 'text-tp-coral' : 'text-tp-ink'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={switchHref}
            onClick={switchLocale}
            aria-label={dict.common.switchLocale}
            className="rounded-full border border-tp-navy/20 px-3 py-1.5 font-tp-display text-xs font-semibold uppercase text-tp-navy hover:border-tp-navy"
          >
            {otherLocale}
          </Link>
          <Link href={`${base}/shop/cart`} aria-label={dict.common.nav.cart} className="relative p-2 text-tp-navy hover:text-tp-coral">
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-tp-coral px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <TpButton href={`${base}/enrol`} className="hidden !px-4 !py-2 !text-sm sm:inline-flex">
            {dict.common.nav.enrol}
          </TpButton>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-label={open ? dict.common.nav.close : dict.common.nav.menu}
            className="p-2 text-tp-navy lg:hidden"
          >
            {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t border-tp-navy/10 bg-tp-cream px-4 pb-6 pt-2 lg:hidden">
          <ul className="flex flex-col gap-1">
            {links.map(l => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 font-tp-display font-medium text-tp-ink hover:bg-tp-sand"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-2">
              <TpButton href={`${base}/enrol`} className="w-full">
                {dict.common.nav.enrol}
              </TpButton>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
