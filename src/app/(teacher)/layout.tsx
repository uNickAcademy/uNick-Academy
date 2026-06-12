'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, User, Calendar, Users, BookOpen, LogOut } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/nauczyciel/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/nauczyciel/dziennik', label: 'Register', icon: BookOpen },
  { href: '/nauczyciel/profil', label: 'Profile', icon: User },
  { href: '/nauczyciel/dostepnosc', label: 'Availability', icon: Calendar },
  { href: '/nauczyciel/uczniowie', label: 'Students', icon: Users },
]

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col py-6 px-4 fixed h-full z-10">
        <Link href="/" className="px-2 mb-8 block">
          <span className="text-xl font-black text-[#23479E]">
            uNick Academy
          </span>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#EAF3FF] text-[#23479E]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        <form action="/api/auth/logout" method="post">
          <button type="submit" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all w-full">
            <LogOut size={18} />
            Log out
          </button>
        </form>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
                active ? 'text-[#23479E]' : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              <span className="mt-0.5">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
