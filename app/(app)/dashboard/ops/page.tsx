import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getHighestRole } from "@/lib/auth/session"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusPill } from "@/components/shared/StatusPill"
import { AlertCircle, BookOpen, Clock, Users, CheckSquare, AlertTriangle } from "lucide-react"
import { formatPLN, formatDate } from "@/lib/utils/formatters"
import type { Metadata } from "next"
import type { UserEntityRole } from "@/types/domain"
import Link from "next/link"

export const metadata: Metadata = { title: "Dashboard Operacyjny" }

export default async function OpsDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: roles } = await supabase
    .schema("ufos")
    .from("user_entity_roles")
    .select("*")
    .eq("user_id", user.id)

  const role = getHighestRole((roles ?? []) as UserEntityRole[])
  if (role === "owner_cfo") redirect("/dashboard/cfo")

  const today = new Date().toISOString().slice(0, 10)
  const currentMonthStr = new Date(new Date().setDate(1)).toISOString().slice(0, 10)

  // Dzisiejsze lekcje
  const { data: todaysLessons } = await supabase
    .schema("ufos")
    .from("lesson_analytics")
    .select("id, starts_at, student_name, teacher_name, lesson_status, location_type, lesson_format, group_name")
    .eq("lesson_date", today)
    .order("starts_at", { ascending: true })

  // Lekcje z przeszłości nadal w statusie 'scheduled' (niezaznaczone przez nauczyciela)
  const { data: unmarkedLessons } = await supabase
    .schema("ufos")
    .from("lesson_analytics")
    .select("id, lesson_date, starts_at, student_name, teacher_name, group_name")
    .eq("lesson_status", "scheduled")
    .lt("lesson_date", today)
    .order("starts_at", { ascending: false })
    .limit(10)

  // Uczniowie z zaległościami (top 5)
  const { data: debtors } = await supabase
    .schema("ufos")
    .from("students_with_debt")
    .select("id, student_name, teacher_name, credit_balance, status")
    .lt("credit_balance", 0)
    .order("credit_balance", { ascending: true })
    .limit(5)

  // Statystyki miesiąca
  const { data: monthStats } = await supabase
    .schema("ufos")
    .from("monthly_summary")
    .select("completed_lessons, upcoming_lessons, missed_lessons, active_students, total_revenue")
    .eq("period", currentMonthStr)
    .single()

  const totalDebt = (debtors ?? []).reduce((s, d) => s + Math.abs(Number(d.credit_balance) || 0), 0)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Dashboard Operacyjny</h1>
        <p className="text-sm text-brand-subtle mt-1">
          {new Date().toLocaleDateString("pl-PL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Statystyki miesiąca */}
      {monthStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Zrealizowane</p>
            <p className="text-xl font-bold text-navy-500">{monthStats.completed_lessons ?? 0}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Zaplanowane</p>
            <p className="text-xl font-bold text-navy-500">{monthStats.upcoming_lessons ?? 0}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Uczniowie</p>
            <p className="text-xl font-bold text-navy-500">{monthStats.active_students ?? 0}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Przychody</p>
            <p className="text-xl font-bold text-brand-green">{formatPLN(Number(monthStats.total_revenue ?? 0))}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dzisiejsze lekcje */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EBF0] flex items-center gap-2">
            <Clock className="w-4 h-4 text-navy-400" />
            <h2 className="text-sm font-semibold text-navy-500">Dzisiaj</h2>
            {todaysLessons && todaysLessons.length > 0 && (
              <span className="ml-auto text-xs text-brand-subtle">{todaysLessons.length} lekcji</span>
            )}
          </div>
          {!todaysLessons || todaysLessons.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Brak lekcji na dziś"
              description="Żadne lekcje nie są zaplanowane na dzisiaj."
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-[#E8EBF0]">
              {todaysLessons.map((l) => (
                <li key={l.id} className="flex items-center justify-between px-5 py-3 hover:bg-brand-muted/40">
                  <div>
                    <p className="text-sm font-medium text-navy-500">
                      {l.group_name ?? l.student_name ?? "—"}
                    </p>
                    <p className="text-xs text-brand-subtle">
                      {l.teacher_name ?? "—"} · {l.starts_at ? new Date(l.starts_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </p>
                  </div>
                  <StatusPill
                    label={l.lesson_status === "present" ? "Zrealizowana" : l.lesson_status === "absent" ? "Nieobecność" : "Zaplanowana"}
                    variant={l.lesson_status === "present" ? "green" : l.lesson_status === "absent" ? "red" : "subtle"}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Niezaznaczone lekcje */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EBF0] flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-brand-amber" />
            <h2 className="text-sm font-semibold text-navy-500">Do zaznaczenia</h2>
            {unmarkedLessons && unmarkedLessons.length > 0 && (
              <span className="ml-auto text-xs font-medium text-brand-amber">{unmarkedLessons.length}</span>
            )}
          </div>
          {!unmarkedLessons || unmarkedLessons.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Wszystkie zaznaczone"
              description="Nauczyciele zaznaczyli wszystkie minione lekcje."
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-[#E8EBF0]">
              {unmarkedLessons.map((l) => (
                <li key={l.id} className="flex items-center justify-between px-5 py-3 hover:bg-brand-muted/40">
                  <div>
                    <p className="text-sm font-medium text-navy-500">
                      {l.group_name ?? l.student_name ?? "—"}
                    </p>
                    <p className="text-xs text-brand-subtle">
                      {l.teacher_name ?? "—"} · {formatDate(l.lesson_date)}
                    </p>
                  </div>
                  <AlertCircle className="w-4 h-4 text-brand-amber shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Zaległości płatnicze */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8EBF0] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-red" />
            <h2 className="text-sm font-semibold text-navy-500">Zaległości płatnicze</h2>
            {(debtors?.length ?? 0) > 0 && (
              <span className="ml-auto text-xs font-medium text-brand-red">{formatPLN(totalDebt)}</span>
            )}
          </div>
          {!debtors || debtors.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Brak zaległości"
              description="Wszyscy uczniowie mają uregulowane płatności."
              className="py-8"
            />
          ) : (
            <>
              <ul className="divide-y divide-[#E8EBF0]">
                {debtors.map((d) => (
                  <li key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-brand-muted/40">
                    <div>
                      <p className="text-sm font-medium text-navy-500">{d.student_name ?? "—"}</p>
                      <p className="text-xs text-brand-subtle">{d.teacher_name ?? "—"}</p>
                    </div>
                    <span className="text-sm font-semibold text-brand-red">
                      {formatPLN(Number(d.credit_balance))}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="px-5 py-3 border-t border-[#E8EBF0]">
                <Link href="/lekcje/zaleglosci" className="text-xs text-navy-500 hover:underline">
                  Wszystkie zaległości →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Szybki dostęp */}
        <div className="card">
          <h2 className="text-sm font-semibold text-navy-500 mb-4">Szybki dostęp</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/lekcje" className="btn-secondary justify-center text-xs py-4 flex-col gap-1.5 h-auto">
              <BookOpen className="w-4 h-4" />
              Lekcje
            </Link>
            <Link href="/lekcje/zaleglosci" className="btn-secondary justify-center text-xs py-4 flex-col gap-1.5 h-auto">
              <AlertTriangle className="w-4 h-4" />
              Zaległości
            </Link>
            <Link href="/lekcje/rentownosc" className="btn-secondary justify-center text-xs py-4 flex-col gap-1.5 h-auto">
              <Users className="w-4 h-4" />
              Rentowność
            </Link>
            <Link href="/import" className="btn-secondary justify-center text-xs py-4 flex-col gap-1.5 h-auto">
              <CheckSquare className="w-4 h-4" />
              Import danych
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
