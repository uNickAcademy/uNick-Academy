'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, Calendar,
  GraduationCap, CreditCard, Gift, LogOut, UsersRound, Tag, Megaphone, Building2, Target, BarChart3, Repeat, FileCheck, Inbox, Landmark, Bell
} from 'lucide-react'

// adminOnly: pozycje konfiguracyjne niedostępne dla recepcji
const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/studenci', label: 'Studenci', icon: Users },
  { href: '/admin/grupy', label: 'Grupy', icon: UsersRound },
  { href: '/admin/zapisy', label: 'Prośby o zapis', icon: Inbox },
  { href: '/admin/firmy', label: 'Firmy (B2B)', icon: Building2 },
  { href: '/admin/pipeline', label: 'Pipeline B2B', icon: Target, adminOnly: true },
  { href: '/admin/lekcje', label: 'Lekcje', icon: BookOpen },
  { href: '/admin/kalendarz', label: 'Kalendarz', icon: Calendar },
  { href: '/admin/zastepstwa', label: 'Zastępstwa', icon: Repeat },
  { href: '/admin/nauczyciele', label: 'Nauczyciele', icon: GraduationCap, adminOnly: true },
  { href: '/admin/raporty', label: 'Raporty', icon: BarChart3, adminOnly: true },
  { href: '/admin/cennik', label: 'Cennik', icon: Tag, adminOnly: true },
  { href: '/admin/regulamin', label: 'Regulamin i zgody', icon: FileCheck, adminOnly: true },
  { href: '/admin/platnosci', label: 'Płatności', icon: CreditCard },
  { href: '/admin/komunikacja', label: 'Komunikacja', icon: Megaphone },
  { href: '/admin/polecenia', label: 'Polecenia', icon: Gift, adminOnly: true },
  { href: '/ufos', label: 'Finanse (uFOS)', icon: Landmark, adminOnly: true },
]

export function AdminSidebar({ role, pendingRequests = 0, unreadNotifications = 0 }: { role: string; pendingRequests?: number; unreadNotifications?: number }) {
  const pathname = usePathname()
  const isAdmin = role === 'admin'
  const items = NAV.filter((i) => isAdmin || !i.adminOnly)
  const [pending, setPending] = useState(pendingRequests)
  const [unread, setUnread] = useState(unreadNotifications)

  useEffect(() => {
    setPending(pendingRequests)
  }, [pendingRequests])
  useEffect(() => {
    setUnread(unreadNotifications)
  }, [unreadNotifications])

  // Wyzeruj licznik dzwonka po wejściu na stronę powiadomień (oznacza przeczytane)
  useEffect(() => {
    if (pathname === '/admin/powiadomienia') setUnread(0)
  }, [pathname])

  useEffect(() => {
    const tick = async () => {
      try {
        const [rq, nt] = await Promise.all([
          fetch('/api/admin/booking-requests', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/admin/notifications', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null),
        ])
        if (rq && typeof rq.pending === 'number') setPending(rq.pending)
        if (nt && typeof nt.unread === 'number' && pathname !== '/admin/powiadomienia') setUnread(nt.unread)
      } catch {
        // ignorujemy chwilowe błędy sieci — odśwież przy następnym ticku
      }
    }
    const interval = setInterval(tick, 20000)
    return () => clearInterval(interval)
  }, [pathname])

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col py-6 px-3 fixed h-full z-10">
      <div className="px-3 mb-8 flex items-center justify-between">
        <span className="text-lg font-black text-[#23479E]">{isAdmin ? 'uNick Admin' : 'uNick Recepcja'}</span>
        <Link href="/admin/powiadomienia" title="Powiadomienia"
          className={`relative p-2 rounded-lg transition-colors ${pathname === '/admin/powiadomienia' ? 'bg-[#23479E] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const badge = href === '/admin/zapisy' && pending > 0 ? pending : null
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#23479E] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {badge !== null && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <form action="/api/auth/logout" method="post">
        <button type="submit" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all w-full">
          <LogOut size={17} />Wyloguj
        </button>
      </form>
    </aside>
  )
}
