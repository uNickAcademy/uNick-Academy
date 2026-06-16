import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getHighestRole } from "@/lib/auth/session"
import { MetricCard } from "@/components/shared/MetricCard"
import { TrendingUp, Users, BookOpen, AlertTriangle, ArrowDownToLine } from "lucide-react"
import { formatPLN, formatPercent, formatNumber, formatMonth } from "@/lib/utils/formatters"
import type { Metadata } from "next"
import type { UserEntityRole } from "@/types/domain"
import Link from "next/link"

export const metadata: Metadata = { title: "Dashboard CFO" }

export default async function CfoDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: roles } = await supabase
    .schema("ufos")
    .from("user_entity_roles")
    .select("*")
    .eq("user_id", user.id)

  const role = getHighestRole((roles ?? []) as UserEntityRole[])
  if (role !== "owner_cfo") redirect("/dashboard/ops")

  const currentMonth = new Date()
  currentMonth.setDate(1)
  const currentMonthStr = currentMonth.toISOString().slice(0, 10)

  const prevMonth = new Date(currentMonth)
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  const prevMonthStr = prevMonth.toISOString().slice(0, 10)

  // Podsumowanie miesięczne z widoku ufos.monthly_summary
  const { data: summaries } = await supabase
    .schema("ufos")
    .from("monthly_summary")
    .select("*")
    .in("period", [currentMonthStr, prevMonthStr])
    .order("period", { ascending: false })

  const current = summaries?.find((s) => s.period === currentMonthStr)
  const prev    = summaries?.find((s) => s.period === prevMonthStr)

  // Rentowność nauczycieli – top 3 i bottom 3
  const { data: teacherStats } = await supabase
    .schema("ufos")
    .from("teacher_profitability")
    .select("*")
    .eq("period", currentMonthStr)
    .order("total_margin", { ascending: false })

  const top3Teachers    = teacherStats?.slice(0, 3) ?? []
  const bottom3Teachers = [...(teacherStats ?? [])].reverse().slice(0, 3)

  // Uczniowie z zaległościami
  const { data: debtors } = await supabase
    .schema("ufos")
    .from("students_with_debt")
    .select("id, student_name, credit_balance, teacher_name, status")
    .lt("credit_balance", 0)
    .order("credit_balance", { ascending: true })
    .limit(5)

  const totalDebt = debtors?.reduce((sum, d) => sum + (Number(d.credit_balance) || 0), 0) ?? 0

  // Trend przychodów
  const revenueTrend = current?.total_revenue && prev?.total_revenue
    ? ((Number(current.total_revenue) - Number(prev.total_revenue)) / Number(prev.total_revenue) * 100).toFixed(1)
    : null

  const hasData = !!(current?.completed_lessons || (teacherStats && teacherStats.length > 0))

  return (
    <div className="max-w-6xl mx-auto">
      {/* Nagłówek */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Dashboard CFO</h1>
        <p className="text-sm text-brand-subtle mt-1">
          {new Date().toLocaleDateString("pl-PL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {current && <span className="ml-2">· dane za {formatMonth(currentMonthStr)}</span>}
        </p>
      </div>

      {!hasData ? (
        <div className="card">
          <div className="flex flex-col items-center py-10 text-center">
            <ArrowDownToLine className="w-10 h-10 text-brand-subtle mb-3" />
            <h2 className="text-base font-semibold text-navy-500 mb-1">Brak danych za ten miesiąc</h2>
            <p className="text-sm text-brand-subtle mb-4">
              Dane z lekcji pojawią się gdy nauczyciele odnotują obecności w aplikacji
            </p>
            <Link href="/lekcje" className="btn-secondary text-sm">Przejdź do lekcji</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* 3 KLUCZOWE LICZBY */}
          <section>
            <h2 className="text-xs font-semibold text-brand-subtle uppercase tracking-wide mb-3">
              Kluczowe liczby – {formatMonth(currentMonthStr)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                title="Przychody z lekcji"
                value={formatPLN(Number(current?.total_revenue ?? 0))}
                subtitle={`${formatNumber(Number(current?.completed_lessons ?? 0))} lekcji zrealizowanych`}
                icon={TrendingUp}
                trend={revenueTrend ? {
                  value: `${Math.abs(Number(revenueTrend))}% vs poprzedni miesiąc`,
                  positive: Number(revenueTrend) >= 0,
                } : undefined}
                variant={!current?.total_revenue ? "default" : Number(current.total_revenue) > 0 ? "success" : "warning"}
              />
              <MetricCard
                title="Koszty nauczycieli"
                value={formatPLN(Number(current?.total_teacher_cost ?? 0))}
                subtitle={`${formatNumber(Number(current?.active_teachers ?? 0))} aktywnych nauczycieli`}
                icon={Users}
                variant="default"
              />
              <MetricCard
                title="Marża brutto"
                value={formatPLN(Number(current?.total_margin ?? 0))}
                subtitle={`${formatPercent(Number(current?.avg_margin_pct ?? 0))} marży`}
                icon={BookOpen}
                variant={Number(current?.avg_margin_pct ?? 0) >= 40 ? "success" : Number(current?.avg_margin_pct ?? 0) >= 20 ? "warning" : "danger"}
              />
            </div>
          </section>

          {/* 3 RYZYKA / ALERTY */}
          <section>
            <h2 className="text-xs font-semibold text-brand-subtle uppercase tracking-wide mb-3">
              Ryzyka i alerty
            </h2>
            <div className="space-y-2">
              {(debtors?.length ?? 0) > 0 && (
                <div className="card border-l-4 border-l-brand-red py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-navy-500">
                          Zaległości płatnicze: {formatPLN(Math.abs(totalDebt))}
                        </p>
                        <p className="text-xs text-brand-subtle mt-0.5">
                          {debtors?.length} uczniów z ujemnym saldem
                        </p>
                      </div>
                    </div>
                    <Link href="/lekcje/zaleglosci" className="text-xs text-navy-500 hover:underline shrink-0">
                      Szczegóły →
                    </Link>
                  </div>
                </div>
              )}
              {Number(current?.missed_lessons ?? 0) > 5 && (
                <div className="card border-l-4 border-l-brand-amber py-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-brand-amber shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-navy-500">
                        Odwołane lekcje: {current?.missed_lessons}
                      </p>
                      <p className="text-xs text-brand-subtle mt-0.5">
                        Ten miesiąc – sprawdź nauczycieli z dużą liczbą nieobecności
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {(debtors?.length === 0 && Number(current?.missed_lessons ?? 0) <= 5) && (
                <div className="card py-4">
                  <div className="flex items-center gap-3 text-brand-green">
                    <div className="w-2 h-2 rounded-full bg-brand-green" />
                    <p className="text-sm font-medium">Brak aktywnych ryzyk</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* TOP NAUCZYCIELE */}
          {top3Teachers.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-brand-subtle uppercase tracking-wide">
                    Top 3 – najrentowniejsi nauczyciele
                  </h2>
                  <Link href="/lekcje/rentownosc" className="text-xs text-navy-500 hover:underline">
                    Wszyscy →
                  </Link>
                </div>
                <div className="card p-0 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-muted">
                      <tr>
                        <th className="text-left py-2 px-4 text-xs font-medium text-brand-subtle">Nauczyciel</th>
                        <th className="text-right py-2 px-4 text-xs font-medium text-brand-subtle">Marża</th>
                        <th className="text-right py-2 px-4 text-xs font-medium text-brand-subtle">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top3Teachers.map((t, i) => (
                        <tr key={t.teacher_id} className="border-t border-[#E8EBF0]">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-brand-subtle w-4">{i + 1}.</span>
                              <span className="font-medium text-navy-500 truncate max-w-[140px]">
                                {t.teacher_name ?? "—"}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium text-brand-green">
                            {formatPLN(Number(t.total_margin))}
                          </td>
                          <td className="py-2.5 px-4 text-right text-brand-subtle">
                            {formatPercent(Number(t.margin_pct))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-xs font-semibold text-brand-subtle uppercase tracking-wide mb-3">
                  Niższa marża – wymaga uwagi
                </h2>
                <div className="card p-0 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-muted">
                      <tr>
                        <th className="text-left py-2 px-4 text-xs font-medium text-brand-subtle">Nauczyciel</th>
                        <th className="text-right py-2 px-4 text-xs font-medium text-brand-subtle">Marża</th>
                        <th className="text-right py-2 px-4 text-xs font-medium text-brand-subtle">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bottom3Teachers.map((t) => (
                        <tr key={t.teacher_id} className="border-t border-[#E8EBF0]">
                          <td className="py-2.5 px-4">
                            <span className="font-medium text-navy-500 truncate max-w-[140px] block">
                              {t.teacher_name ?? "—"}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium">
                            <span className={Number(t.total_margin) < 0 ? "text-brand-red" : "text-brand-amber"}>
                              {formatPLN(Number(t.total_margin))}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right text-brand-subtle">
                            {formatPercent(Number(t.margin_pct))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* ZALEGŁOŚCI */}
          {(debtors?.length ?? 0) > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-brand-subtle uppercase tracking-wide">
                  Zaległości płatnicze
                </h2>
                <Link href="/lekcje/zaleglosci" className="text-xs text-navy-500 hover:underline">
                  Wszyscy →
                </Link>
              </div>
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-brand-muted">
                    <tr>
                      <th className="text-left py-2 px-4 text-xs font-medium text-brand-subtle">Uczeń</th>
                      <th className="text-left py-2 px-4 text-xs font-medium text-brand-subtle">Nauczyciel</th>
                      <th className="text-right py-2 px-4 text-xs font-medium text-brand-subtle">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtors?.map((d) => (
                      <tr key={d.id} className="border-t border-[#E8EBF0]">
                        <td className="py-2.5 px-4 font-medium text-navy-500">{d.student_name}</td>
                        <td className="py-2.5 px-4 text-brand-subtle">{d.teacher_name ?? "—"}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-brand-red">
                          {formatPLN(Number(d.credit_balance))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
