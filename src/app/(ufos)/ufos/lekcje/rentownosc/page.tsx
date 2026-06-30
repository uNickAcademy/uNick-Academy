import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { formatPLN, formatPercent, formatNumber, formatMonth } from "@/lib/ufos/formatters"
import { TrendingUp, Users, ChevronUp, ChevronDown } from "lucide-react"
import { MetricCard } from "@/app/components/ufos/shared/MetricCard"
import { EmptyState } from "@/app/components/ufos/shared/EmptyState"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Rentowność kursów" }

export default async function RentownoscPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const currentMonth = new Date()
  currentMonth.setDate(1)
  const currentMonthStr = currentMonth.toISOString().slice(0, 10)

  // Rentowność nauczycieli w tym miesiącu
  const { data: teacherStats } = await supabase
    .schema("ufos")
    .from("teacher_profitability")
    .select("*")
    .eq("period", currentMonthStr)
    .order("total_margin", { ascending: false })

  // Ostatnie 6 miesięcy
  const sixMonthsAgo = new Date(currentMonth)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: monthlySummaries } = await supabase
    .schema("ufos")
    .from("monthly_summary")
    .select("*")
    .gte("period", sixMonthsAgo.toISOString().slice(0, 10))
    .order("period", { ascending: false })

  const current = monthlySummaries?.[0]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Rentowność</h1>
        <p className="text-sm text-brand-subtle mt-1">
          Marże brutto, koszty i przychody per nauczyciel · {formatMonth(currentMonthStr)}
        </p>
      </div>

      {/* Podsumowanie miesiąca */}
      {current && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Przychody"
            value={formatPLN(Number(current.total_revenue ?? 0))}
            icon={TrendingUp}
          />
          <MetricCard
            title="Koszty nauczycieli"
            value={formatPLN(Number(current.total_teacher_cost ?? 0))}
            icon={Users}
          />
          <MetricCard
            title="Marża brutto"
            value={formatPLN(Number(current.total_margin ?? 0))}
            variant={Number(current.avg_margin_pct ?? 0) >= 40 ? "success" : "warning"}
          />
          <MetricCard
            title="Średnia marża %"
            value={formatPercent(Number(current.avg_margin_pct ?? 0))}
            variant={Number(current.avg_margin_pct ?? 0) >= 40 ? "success" : Number(current.avg_margin_pct ?? 0) >= 20 ? "warning" : "danger"}
          />
        </div>
      )}

      {/* Tabela nauczycieli */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8EBF0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-500">Rentowność per nauczyciel</h2>
          <span className="text-xs text-brand-subtle">{formatMonth(currentMonthStr)}</span>
        </div>

        {!teacherStats || teacherStats.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="Brak danych za ten miesiąc"
            description="Dane pojawią się gdy nauczyciele odnotują obecności w aplikacji"
            className="py-10"
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-muted">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-brand-subtle">Nauczyciel</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-subtle">Lekcje</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-subtle">Godziny</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-subtle">Przychód</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-subtle">Koszt</th>
                <th className="text-right py-3 px-6 text-xs font-medium text-brand-subtle">Marża</th>
              </tr>
            </thead>
            <tbody>
              {teacherStats.map((t, i) => {
                const margin = Number(t.total_margin ?? 0)
                const pct    = Number(t.margin_pct ?? 0)
                return (
                  <tr key={t.teacher_id} className="border-t border-[#E8EBF0] hover:bg-brand-muted/40 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-brand-subtle w-5">{i + 1}.</span>
                        <span className="font-medium text-navy-500">{t.teacher_name ?? "—"}</span>
                        {pct >= 50 && <ChevronUp className="w-3 h-3 text-brand-green" />}
                        {pct < 20 && <ChevronDown className="w-3 h-3 text-brand-red" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-brand-subtle">
                      {formatNumber(Number(t.completed_lessons ?? 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-brand-subtle">
                      {Number(t.hours_worked ?? 0).toFixed(1)} h
                    </td>
                    <td className="py-3 px-4 text-right text-navy-500">
                      {formatPLN(Number(t.revenue_generated ?? 0))}
                    </td>
                    <td className="py-3 px-4 text-right text-brand-subtle">
                      {formatPLN(Number(t.total_cost ?? 0))}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-semibold ${margin < 0 ? "text-brand-red" : margin < 100 ? "text-brand-amber" : "text-brand-green"}`}>
                          {formatPLN(margin)}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${pct >= 40 ? "bg-green-100 text-green-700" : pct >= 20 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          {formatPercent(pct)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-brand-muted border-t-2 border-[#E8EBF0]">
              <tr>
                <td className="py-3 px-6 font-semibold text-navy-500" colSpan={3}>
                  Razem
                </td>
                <td className="py-3 px-4 text-right font-semibold text-navy-500">
                  {formatPLN(teacherStats.reduce((s, t) => s + Number(t.revenue_generated ?? 0), 0))}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-brand-subtle">
                  {formatPLN(teacherStats.reduce((s, t) => s + Number(t.total_cost ?? 0), 0))}
                </td>
                <td className="py-3 px-6 text-right font-semibold text-navy-500">
                  {formatPLN(teacherStats.reduce((s, t) => s + Number(t.total_margin ?? 0), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Historia miesięczna */}
      {monthlySummaries && monthlySummaries.length > 1 && (
        <div className="card mt-6 p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8EBF0]">
            <h2 className="text-sm font-semibold text-navy-500">Historia – ostatnie 6 miesięcy</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-brand-muted">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-brand-subtle">Miesiąc</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-subtle">Lekcje</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-subtle">Przychód</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-subtle">Koszty</th>
                <th className="text-right py-3 px-6 text-xs font-medium text-brand-subtle">Marża</th>
              </tr>
            </thead>
            <tbody>
              {monthlySummaries.map((m) => (
                <tr key={m.period} className="border-t border-[#E8EBF0]">
                  <td className="py-2.5 px-6 font-medium text-navy-500">{formatMonth(m.period)}</td>
                  <td className="py-2.5 px-4 text-right text-brand-subtle">{m.completed_lessons}</td>
                  <td className="py-2.5 px-4 text-right">{formatPLN(Number(m.total_revenue ?? 0))}</td>
                  <td className="py-2.5 px-4 text-right text-brand-subtle">{formatPLN(Number(m.total_teacher_cost ?? 0))}</td>
                  <td className="py-2.5 px-6 text-right">
                    <span className={`font-medium ${Number(m.total_margin ?? 0) >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                      {formatPLN(Number(m.total_margin ?? 0))}
                    </span>
                    <span className="text-xs text-brand-subtle ml-1">({formatPercent(Number(m.avg_margin_pct ?? 0))})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Link href="/ufos/lekcje" className="btn-secondary text-sm">
          ← Wszystkie lekcje
        </Link>
      </div>
    </div>
  )
}
