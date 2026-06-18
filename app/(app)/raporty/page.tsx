import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BarChart3, TrendingUp, TrendingDown, Users, BookOpen } from "lucide-react"
import { formatPLN, formatPercent, formatMonth, formatNumber } from "@/lib/utils/formatters"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Raporty" }

export default async function RaportyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: monthlySummaries } = await supabase
    .schema("ufos")
    .from("monthly_summary")
    .select("*")
    .order("period", { ascending: false })
    .limit(6)

  const months = (monthlySummaries ?? []).reverse()
  const current = months.length > 0 ? months[months.length - 1] : null
  const previous = months.length > 1 ? months[months.length - 2] : null

  function delta(curr: number | null, prev: number | null): { value: number; pct: number } | null {
    if (curr === null || prev === null || prev === 0) return null
    const diff = curr - prev
    return { value: diff, pct: (diff / Math.abs(prev)) * 100 }
  }

  const revDelta = delta(Number(current?.total_revenue ?? null), Number(previous?.total_revenue ?? null))
  const marginDelta = delta(Number(current?.total_margin ?? null), Number(previous?.total_margin ?? null))
  const lessonDelta = delta(Number(current?.completed_lessons ?? null), Number(previous?.completed_lessons ?? null))

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy-500 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-500">Raporty</h1>
            <p className="text-sm text-brand-subtle">Przegląd finansowy · ostatnie 6 miesięcy</p>
          </div>
        </div>
      </div>

      {/* MoM porównanie */}
      {current && previous && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Przychody vs. poprzedni miesiąc</p>
            <p className="text-xl font-bold text-navy-500">{formatPLN(Number(current.total_revenue))}</p>
            {revDelta && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${revDelta.value >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                {revDelta.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{revDelta.value >= 0 ? "+" : ""}{revDelta.pct.toFixed(1)}% ({formatPLN(revDelta.value)})</span>
              </div>
            )}
          </div>
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Marża brutto vs. poprzedni miesiąc</p>
            <p className="text-xl font-bold text-brand-green">{formatPLN(Number(current.total_margin))}</p>
            {marginDelta && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${marginDelta.value >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                {marginDelta.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{marginDelta.value >= 0 ? "+" : ""}{marginDelta.pct.toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Lekcje vs. poprzedni miesiąc</p>
            <p className="text-xl font-bold text-navy-500">{formatNumber(Number(current.completed_lessons))}</p>
            {lessonDelta && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${lessonDelta.value >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                {lessonDelta.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{lessonDelta.value >= 0 ? "+" : ""}{lessonDelta.value}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabela historyczna */}
      <div className="card">
        <h2 className="text-sm font-semibold text-navy-500 mb-4">Historia miesięczna</h2>

        {months.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-8 h-8 text-brand-subtle mx-auto mb-2" />
            <p className="text-sm text-brand-subtle">Brak danych historycznych</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8EBF0]">
                  <th className="text-left py-2 text-xs font-medium text-brand-subtle">Miesiąc</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Lekcje</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Odwołane</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Uczniowie</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Nauczyciele</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Przychody</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Koszty</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Marża</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Marża %</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => {
                  const marginPct = Number(m.avg_margin_pct || 0)
                  return (
                    <tr key={m.period} className="border-b border-[#E8EBF0] last:border-0 hover:bg-brand-muted/40">
                      <td className="py-3 font-medium text-navy-500">{formatMonth(m.period)}</td>
                      <td className="py-3 text-right text-brand-subtle">{formatNumber(Number(m.completed_lessons))}</td>
                      <td className="py-3 text-right">
                        {Number(m.missed_lessons || 0) > 0 ? (
                          <span className="text-brand-amber">{m.missed_lessons}</span>
                        ) : (
                          <span className="text-brand-subtle">0</span>
                        )}
                      </td>
                      <td className="py-3 text-right text-brand-subtle">{m.active_students ?? "—"}</td>
                      <td className="py-3 text-right text-brand-subtle">{m.active_teachers ?? "—"}</td>
                      <td className="py-3 text-right text-brand-subtle">{formatPLN(Number(m.total_revenue))}</td>
                      <td className="py-3 text-right text-brand-subtle">{formatPLN(Number(m.total_teacher_cost))}</td>
                      <td className="py-3 text-right font-medium text-brand-green">{formatPLN(Number(m.total_margin))}</td>
                      <td className="py-3 text-right">
                        <span className={marginPct >= 40 ? "text-brand-green" : marginPct >= 20 ? "text-brand-amber" : "text-brand-red"}>
                          {formatPercent(marginPct)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sekcja raportów do pobrania - placeholder */}
      <div className="mt-6 card bg-brand-muted py-5">
        <h2 className="text-sm font-semibold text-navy-500 mb-2">Eksport raportów</h2>
        <p className="text-xs text-brand-subtle">
          Generowanie raportów PDF/Excel (przychody, koszty, rozliczenia nauczycieli) — w przygotowaniu.
        </p>
      </div>
    </div>
  )
}
