'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, BookOpen, TrendingUp, Gift, CreditCard, Receipt, LogOut, User } from 'lucide-react'
import { t, type Lang } from '@/lib/i18n'

export function StudentShell({ lang, billingType = 'individual', childOptions = [], activeStudentId = '', children }: {
  lang: Lang; billingType?: 'individual' | 'b2b'
  childOptions?: { id: string; name: string }[]; activeStudentId?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  // Rodzic z kilkorgiem dzieci: wybór dziecka zapisany w cookie, cały panel
  // renderuje dane wybranego podkonta (getStudentByProfileId czyta to cookie).
  function setActiveStudent(id: string) {
    document.cookie = `active_student=${id}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.refresh()
  }

  const ChildSwitcher = childOptions.length > 1 ? (
    <select
      value={activeStudentId}
      onChange={(e) => setActiveStudent(e.target.value)}
      aria-label={lang === 'en' ? 'Select child' : 'Wybierz dziecko'}
      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-800 bg-white focus:outline-none focus:border-[#23479E]"
    >
      {childOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  ) : null

  const ALL_NAV_ITEMS = [
    { href: '/dashboard', label: t(lang, 'nav_dashboard'), icon: LayoutDashboard, b2bHidden: false },
    { href: '/lekcje', label: t(lang, 'nav_lessons'), icon: BookOpen, b2bHidden: false },
    { href: '/postepy', label: t(lang, 'nav_progress'), icon: TrendingUp, b2bHidden: false },
    { href: '/polecenia', label: t(lang, 'nav_referrals'), icon: Gift, b2bHidden: false },
    { href: '/platnosci', label: t(lang, 'nav_payments'), icon: CreditCard, b2bHidden: true },
    { href: '/rozliczenia', label: t(lang, 'nav_billing'), icon: Receipt, b2bHidden: true },
    { href: '/profil', label: t(lang, 'nav_profile'), icon: User, b2bHidden: false },
  ]
  const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => billingType !== 'b2b' || !item.b2bHidden)
  // Dolny pasek mobilny mieści 5 pozycji — priorytet: pulpit, lekcje, postępy,
  // płatności (dla b2b polecenia) i profil. Saldo (/rozliczenia) linkowane z
  // /platnosci i /profil; wylogowanie w górnym pasku mobilnym.
  const MOBILE_HREFS = billingType === 'b2b'
    ? ['/dashboard', '/lekcje', '/postepy', '/polecenia', '/profil']
    : ['/dashboard', '/lekcje', '/postepy', '/platnosci', '/profil']
  const MOBILE_NAV_ITEMS = MOBILE_HREFS
    .map((h) => NAV_ITEMS.find((i) => i.href === h))
    .filter((i): i is (typeof NAV_ITEMS)[number] => !!i)

  function setLang(next: Lang) {
    document.cookie = `lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.refresh()
  }

  const Toggle = (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
      {(['pl', 'en'] as Lang[]).map((l) => (
        <button key={l} onClick={() => setLang(l)}
          className={`px-2 py-1 rounded-md text-xs font-bold transition-colors ${lang === l ? 'bg-white text-[#23479E] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col py-6 px-4 fixed h-full z-10">
        <div className="px-2 mb-6 flex items-center justify-between">
          <Link href="/"><span className="text-xl font-black text-[#23479E]">uNick Academy</span></Link>
        </div>
        <div className="px-2 mb-6">{Toggle}</div>
        {ChildSwitcher && <div className="px-2 mb-6">{ChildSwitcher}</div>}

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#EAF3FF] text-[#23479E]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Icon size={18} />{label}
              </Link>
            )
          })}
        </nav>

        <form action="/api/auth/logout" method="post">
          <button type="submit" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all w-full">
            <LogOut size={18} />{t(lang, 'logout')}
          </button>
        </form>
      </aside>

      {/* Mobile: górny pasek z przełącznikiem języka i wylogowaniem (wcześniej
          wylogowanie i profil były dostępne tylko na desktopie) */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-20 flex items-center justify-between gap-2 px-4 h-14">
        <Link href="/dashboard"><span className="text-lg font-black text-[#23479E]">uNick</span></Link>
        <div className="flex items-center gap-2 min-w-0">
          {ChildSwitcher && <div className="max-w-36">{ChildSwitcher}</div>}
          {Toggle}
          <form action="/api/auth/logout" method="post">
            <button type="submit" aria-label={t(lang, 'logout')}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 flex">
        {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${active ? 'text-[#23479E]' : 'text-gray-400'}`}>
              <Icon size={20} /><span className="mt-0.5">{label}</span>
            </Link>
          )
        })}
      </nav>

      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">{children}</main>
    </div>
  )
}
