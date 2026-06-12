'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, FileText, LogOut, Building2 } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/firma/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/firma/pracownicy', label: 'Pracownicy', icon: Users },
  { href: '/firma/platnosci', label: 'Płatności', icon: CreditCard },
  { href: '/firma/faktury', label: 'Faktury', icon: FileText },
]

export default function HrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col py-6 px-4 fixed h-full z-10">
        <div className="px-2 mb-8 flex items-center gap-2">
          <Building2 size={20} className="text-[#23479E]" />
          <span className="text-xl font-black text-[#23479E]">Panel firmy</span>
        </div>
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
            <LogOut size={18} />Wyloguj się
          </button>
        </form>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${active ? 'text-[#23479E]' : 'text-gray-400'}`}>
              <Icon size={20} /><span className="mt-0.5">{label}</span>
            </Link>
          )
        })}
      </nav>

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">{children}</main>
    </div>
  )
}
