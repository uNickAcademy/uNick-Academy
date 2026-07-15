import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users, Clock, TrendingUp, AlertTriangle } from "lucide-react"
import { formatPLN, formatPercent, formatMonth } from "@/lib/ufos/formatters"
import { calculateNetPayout, CONTRACT_TYPE_LABELS } from "@/lib/payroll/pl-zlecenie"
import type { TeacherContractType } from "@/types"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Kadry i Płace" }

export default async function KadryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const currentMonth = new Date()
  currentMonth.setDate(1)
  const currentMonthStr = currentMonth.toISOString().slice(0, 10)

  const prevMonth = new Date(currentMonth)
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  const prevMonthStr = prevMonth.toISOString().slice(0, 10)

  const [{ data: teachers }, { data: prevTeachers }, { data: monthStats }, { data: contractRows }] = await Promise.all([
    supabase.schema("ufos").from("teacher_profitability")
      .select("*")
      .eq("period", currentMonthStr)
      .order("teacher_name"),
    supabase.schema("ufos").from("teacher_profitability")
      .select("teacher_name, hours_worked, total_cost")
      .eq("period", prevMonthStr),
    supabase.schema("ufos").from("monthly_summary")
      .select("active_teachers, total_teacher_cost, completed_lessons")
      .eq("period", currentMonthStr)
      .single(),
    supabase.from("teachers").select("id, contract_type"),
  ])

  const contractByTeacher = new Map((contractRows ?? []).map(t => [t.id, t.contract_type as TeacherContractType]))
  const prevMap = new Map((prevTeachers ?? []).map(t => [t.teacher_name, t]))
  const totalCost = (teachers ?? []).reduce((s, t) => s + Number(t.total_cost || 0), 0)
  const totalHours = (teachers ?? []).reduce((s, t) => s + Number(t.hours_worked || 0), 0)
  const totalNet = (teachers ?? []).reduce((s, t) => {
    const ct = contractByTeacher.get(t.teacher_id) ?? 'b2b'
    return s + calculateNetPayout(Number(t.total_cost || 0), ct).net
  }, 0)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Kadry i Płace</h1>
        <p className="text-sm text-brand-subtle mt-1">
          Rozliczenia nauczycieli · {formatMonth(currentMonthStr)}
        </p>
      </div>

      {/* Metryki */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card py-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3.5 h-3.5 text-navy-400" />
            <p className="text-xs text-brand-subtle">Aktywni nauczyciele</p>
          </div>
          <p className="text-xl font-bold text-navy-500">
            {monthStats?.active_teachers ?? (teachers ?? []).length}
          </p>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-navy-400" />
            <p className="text-xs text-brand-subtle">Godziny pracy</p>
          </div>
          <p className="text-xl font-bold text-navy-500">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-brand-red" />
            <p className="text-xs text-brand-subtle">Koszt brutto</p>
          </div>
          <p className="text-xl font-bold text-brand-red">{formatPLN(totalCost)}</p>
        </div>
        <div className="card py-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-brand-green" />
            <p className="text-xs text-brand-subtle">Do wypłaty (netto, szac.)</p>
          </div>
          <p className="text-xl font-bold text-navy-500">{formatPLN(totalNet)}</p>
        </div>
      </div>

      {/* Tabela nauczycieli */}
      <div className="card">
        <h2 className="text-sm font-semibold text-navy-500 mb-4">Rozliczenie nauczycieli</h2>

        {!teachers || teachers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-brand-subtle mx-auto mb-2" />
            <p className="text-sm text-brand-subtle">Brak danych o nauczycielach w tym miesiącu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8EBF0]">
                  <th className="text-left py-2 text-xs font-medium text-brand-subtle">Nauczyciel</th>
                  <th className="text-left py-2 text-xs font-medium text-brand-subtle">Umowa</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Lekcje</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Godziny</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Przychód</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Koszt brutto</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Do wypłaty (netto)</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Marża</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Marża %</th>
                  <th className="text-right py-2 text-xs font-medium text-brand-subtle">Δ koszt</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => {
                  const prev = prevMap.get(t.teacher_name)
                  const costDelta = prev ? Number(t.total_cost || 0) - Number(prev.total_cost || 0) : null
                  const margin = Number(t.margin_pct || 0)
                  const contractType = contractByTeacher.get(t.teacher_id) ?? 'b2b'
                  const payout = calculateNetPayout(Number(t.total_cost || 0), contractType)
                  return (
                    <tr key={t.teacher_id} className="border-b border-[#E8EBF0] last:border-0 hover:bg-brand-muted/40">
                      <td className="py-3 font-medium text-navy-500">{t.teacher_name}</td>
                      <td className="py-3 text-brand-subtle text-xs">{CONTRACT_TYPE_LABELS[contractType]}</td>
                      <td className="py-3 text-right text-brand-subtle">
                        {t.completed_lessons}
                        {Number(t.cancelled_lessons || 0) > 0 && (
                          <span className="text-brand-amber ml-1 text-xs">
                            (+{t.cancelled_lessons} odw.)
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right text-brand-subtle">{Number(t.hours_worked || 0).toFixed(1)}h</td>
                      <td className="py-3 text-right text-brand-subtle">{formatPLN(Number(t.revenue_generated || 0))}</td>
                      <td className="py-3 text-right font-medium text-navy-500">{formatPLN(Number(t.total_cost || 0))}</td>
                      <td className="py-3 text-right font-semibold text-brand-green">{formatPLN(payout.net)}</td>
                      <td className="py-3 text-right font-medium text-brand-green">{formatPLN(Number(t.total_margin || 0))}</td>
                      <td className="py-3 text-right">
                        <span className={margin >= 40 ? "text-brand-green" : margin >= 20 ? "text-brand-amber" : "text-brand-red"}>
                          {formatPercent(margin)}
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs">
                        {costDelta !== null ? (
                          <span className={costDelta > 0 ? "text-brand-red" : costDelta < 0 ? "text-brand-green" : "text-brand-subtle"}>
                            {costDelta > 0 ? "+" : ""}{formatPLN(costDelta)}
                          </span>
                        ) : (
                          <span className="text-brand-subtle">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 flex items-start gap-2 text-xs text-brand-subtle">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-amber" />
        <p>
          Dane kalkulowane automatycznie z realizacji lekcji (obecność + późne odwołania + no-show liczone jako odbyte).
          Kwota „Do wypłaty (netto)” to szacunek wg standardowej umowy zlecenia (bez PIT-2, 20% KUP, zlecenie jako jedyny
          tytuł ubezpieczenia) — nie zastępuje wyliczenia księgowej. Typ umowy ustawisz w Admin → Nauczyciele.
          Moduł dokumentów kadrowych — w przygotowaniu.
        </p>
      </div>
    </div>
  )
}
