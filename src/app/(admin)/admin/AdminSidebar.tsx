'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, Calendar,
  GraduationCap, CreditCard, Gift, LogOut, UsersRound, Tag, Megaphone, Building2, Target, BarChart3, Repeat, FileCheck, Inbox, Landmark
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

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const isAdmin = role === 'admin'
  const items = NAV.filter((i) => isAdmin || !i.adminOnly)

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col py-6 px-3 fixed h-full z-10">
      <div className="px-3 mb-8">
        <span className="text-lg font-black text-[#23479E]">{isAdmin ? 'uNick Admin' : 'uNick Recepcja'}</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#23479E] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon size={17} />{label}
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
