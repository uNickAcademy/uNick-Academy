"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  TrendingUp,
  Users,
  Calendar,
  CheckSquare,
  Settings,
  LogOut,
  BarChart3,
  ArrowDownToLine,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { signOut } from "@/app/(auth)/login/actions"
import type { UserRole } from "@/types/domain"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard/cfo",
    label: "Dashboard CFO",
    icon: LayoutDashboard,
    roles: ["owner_cfo"],
  },
  {
    href: "/dashboard/ops",
    label: "Dashboard Operacyjny",
    icon: LayoutDashboard,
    roles: ["accounting_ops", "payroll_operator"],
  },
  {
    href: "/import",
    label: "Import danych",
    icon: ArrowDownToLine,
    roles: ["owner_cfo", "accounting_ops"],
  },
  {
    href: "/lekcje",
    label: "Lekcje",
    icon: BookOpen,
  },
  {
    href: "/lekcje/rentownosc",
    label: "Rentowność",
    icon: TrendingUp,
    roles: ["owner_cfo", "accounting_ops"],
  },
  {
    href: "/dokumenty",
    label: "Dokumenty",
    icon: FileText,
    roles: ["owner_cfo", "accounting_ops", "payroll_operator"],
  },
  {
    href: "/kadry",
    label: "Kadry i Płace",
    icon: Users,
    roles: ["owner_cfo", "accounting_ops", "payroll_operator"],
  },
  {
    href: "/zadania",
    label: "Zadania",
    icon: CheckSquare,
    roles: ["owner_cfo", "accounting_ops"],
  },
  {
    href: "/zamkniecie",
    label: "Zamknięcie miesiąca",
    icon: Calendar,
    roles: ["owner_cfo", "accounting_ops"],
  },
  {
    href: "/raporty",
    label: "Raporty",
    icon: BarChart3,
  },
  {
    href: "/ustawienia",
    label: "Ustawienia",
    icon: Settings,
    roles: ["owner_cfo"],
  },
]

interface SidebarProps {
  role: UserRole | null
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || !role || item.roles.includes(role)
  )

  return (
    <aside className="w-60 min-h-screen bg-navy-500 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">u</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">uFOS</div>
            <div className="text-[10px] text-[#9DAAB8] leading-tight">Financial Operating System</div>
          </div>
        </div>
      </div>

      {/* Nawigacja */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                isActive ? "sidebar-link-active" : "sidebar-link"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Wyloguj */}
      <div className="px-3 py-4 border-t border-white/10">
        <form action={signOut}>
          <button
            type="submit"
            className="sidebar-link w-full text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Wyloguj się</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
