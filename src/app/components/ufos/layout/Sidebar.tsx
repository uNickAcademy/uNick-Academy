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
  Bot,
  Landmark,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/ufos/auth/actions"
import type { UserRole } from "@/types/domain"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/ufos/dashboard/cfo",
    label: "Dashboard CFO",
    icon: LayoutDashboard,
    roles: ["owner_cfo"],
  },
  {
    href: "/ufos/dashboard/ops",
    label: "Dashboard Operacyjny",
    icon: LayoutDashboard,
    roles: ["accounting_ops", "payroll_operator"],
  },
  {
    href: "/ufos/import",
    label: "Import danych",
    icon: ArrowDownToLine,
    roles: ["owner_cfo", "accounting_ops"],
  },
  {
    href: "/ufos/lekcje",
    label: "Lekcje",
    icon: BookOpen,
  },
  {
    href: "/ufos/lekcje/rentownosc",
    label: "Rentowność",
    icon: TrendingUp,
    roles: ["owner_cfo", "accounting_ops"],
  },
  {
    href: "/ufos/platnosci",
    label: "Płatności",
    icon: Landmark,
    roles: ["owner_cfo", "accounting_ops"],
  },
  {
    href: "/ufos/dokumenty",
    label: "Dokumenty",
    icon: FileText,
    roles: ["owner_cfo", "accounting_ops", "payroll_operator"],
  },
  {
    href: "/ufos/kadry",
    label: "Kadry i Płace",
    icon: Users,
    roles: ["owner_cfo", "accounting_ops", "payroll_operator"],
  },
  {
    href: "/ufos/zadania",
    label: "Zadania",
    icon: CheckSquare,
    roles: ["owner_cfo", "accounting_ops"],
  },
  {
    href: "/ufos/zamkniecie",
    label: "Zamknięcie miesiąca",
    icon: Calendar,
    roles: ["owner_cfo", "accounting_ops"],
  },
  {
    href: "/ufos/raporty",
    label: "Raporty",
    icon: BarChart3,
  },
  {
    href: "/ufos/ai-cfo",
    label: "AI CFO",
    icon: Bot,
    roles: ["owner_cfo"],
  },
  {
    href: "/ufos/ustawienia",
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
