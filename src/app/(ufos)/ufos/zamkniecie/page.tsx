import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getHighestRole } from "@/lib/ufos/auth/session"
import { Calendar, CheckCircle, Circle, Lock, Plus } from "lucide-react"
import { StatusPill } from "@/app/components/ufos/shared/StatusPill"
import { EmptyState } from "@/app/components/ufos/shared/EmptyState"
import { formatMonth, formatPLN, formatPercent } from "@/lib/ufos/formatters"
import { openMonthClose, toggleChecklistItem, submitForApproval, approveMonthClose } from "./actions"
import type { Metadata } from "next"
import type { UserEntityRole } from "@/types/domain"

export const metadata: Metadata = { title: "Zamknięcie miesiąca" }

const STATUS_LABELS: Record<string, string> = {
  open:      "Otwarte",
  in_review: "Do zatwierdzenia",
  approved:  "Zatwierdzone",
  locked:    "Zablokowane",
}

const STATUS_VARIANT = (s: string): "green" | "amber" | "red" | "subtle" =>
  s === "approved" || s === "locked" ? "green" : s === "in_review" ? "amber" : "subtle"

interface ChecklistItem {
  key: string
  label: string
  done: boolean
  done_at?: string | null
}

export default async function ZamkniециePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: roles } = await supabase
    .schema("ufos")
    .from("user_entity_roles")
    .select("*")
    .eq("user_id", user.id)

  const role = getHighestRole((roles ?? []) as UserEntityRole[])

  const { data: entities } = await supabase
    .schema("ufos")
    .from("entities")
    .select("id, short_name, color")
    .order("short_name")

  const currentMonth = new Date()
  currentMonth.setDate(1)
  const currentMonthStr = currentMonth.toISOString().slice(0, 10)

  const prevMonth = new Date(currentMonth)
  prevMonth.setMonth(prevMonth.getMonth() - 1)

  // Zamknięcia dla aktualnego i poprzedniego miesiąca
  const { data: closes } = await supabase
    .schema("ufos")
    .from("month_closes")
    .select("*")
    .gte("period", prevMonth.toISOString().slice(0, 10))
    .order("period", { ascending: false })

  // Statystyki bieżącego miesiąca z widoku
  const { data: monthStats } = await supabase
    .schema("ufos")
    .from("monthly_summary")
    .select("completed_lessons, total_revenue, total_margin, avg_margin_pct, missed_lessons")
    .eq("period", currentMonthStr)
    .single()

  type MonthClose = NonNullable<typeof closes>[number]

  // Grupuj zamknięcia po entity_id
  const closesByEntity = new Map<string, MonthClose>()
  for (const c of closes ?? []) {
    if (!closesByEntity.has(c.entity_id)) {
      closesByEntity.set(c.entity_id, c)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-500">Zamknięcie miesiąca</h1>
          <p className="text-sm text-brand-subtle mt-1">
            Checklista i zatwierdzenie · {formatMonth(currentMonthStr)}
          </p>
        </div>
      </div>

      {/* Podsumowanie miesiąca */}
      {monthStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Lekcje</p>
            <p className="text-xl font-bold text-navy-500">{monthStats.completed_lessons ?? 0}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Przychody</p>
            <p className="text-xl font-bold text-navy-500">{formatPLN(Number(monthStats.total_revenue ?? 0))}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Marża</p>
            <p className="text-xl font-bold text-brand-green">{formatPLN(Number(monthStats.total_margin ?? 0))}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Marża %</p>
            <p className={`text-xl font-bold ${Number(monthStats.avg_margin_pct ?? 0) >= 40 ? "text-brand-green" : "text-brand-amber"}`}>
              {formatPercent(Number(monthStats.avg_margin_pct ?? 0))}
            </p>
          </div>
        </div>
      )}

      {/* Zamknięcia per podmiot */}
      <div className="space-y-4">
        {entities?.map((entity) => {
          const close = closesByEntity.get(entity.id)
          const checklist: ChecklistItem[] = (close?.checklist as ChecklistItem[]) ?? []
          const doneCount = checklist.filter((i) => i.done).length
          const totalCount = checklist.length
          const allDone = totalCount > 0 && doneCount === totalCount

          return (
            <div key={entity.id} className="card p-0 overflow-hidden">
              {/* Nagłówek podmiotu */}
              <div className="px-5 py-4 border-b border-[#E8EBF0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: entity.color ?? "#1C2B4A" }}
                  />
                  <h2 className="text-sm font-semibold text-navy-500">{entity.short_name}</h2>
                  {close && (
                    <span className="text-xs text-brand-subtle">
                      {doneCount}/{totalCount} punktów
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {close ? (
                    <StatusPill
                      label={STATUS_LABELS[close.status] ?? close.status}
                      variant={STATUS_VARIANT(close.status)}
                    />
                  ) : (
                    <form action={openMonthClose.bind(null, entity.id, currentMonthStr)}>
                      <button type="submit" className="btn-secondary text-xs flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Otwórz zamknięcie
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Checklista */}
              {close && close.status !== "locked" ? (
                <div>
                  <ul className="divide-y divide-[#E8EBF0]">
                    {checklist.map((item) => (
                      <li key={item.key} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-muted/40">
                        {close.status !== "approved" && close.status !== "locked" ? (
                          <form action={toggleChecklistItem.bind(null, close.id, item.key, checklist)}>
                            <button type="submit" className="shrink-0">
                              {item.done
                                ? <CheckCircle className="w-5 h-5 text-brand-green" />
                                : <Circle className="w-5 h-5 text-brand-subtle" />
                              }
                            </button>
                          </form>
                        ) : (
                          <div className="shrink-0">
                            {item.done
                              ? <CheckCircle className="w-5 h-5 text-brand-green" />
                              : <Circle className="w-5 h-5 text-brand-subtle" />
                            }
                          </div>
                        )}
                        <span className={`text-sm ${item.done ? "text-navy-500 line-through opacity-60" : "text-navy-500"}`}>
                          {item.label}
                        </span>
                        {item.done && item.done_at && (
                          <span className="text-xs text-brand-subtle ml-auto">
                            {new Date(item.done_at).toLocaleDateString("pl-PL")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Akcje zamknięcia */}
                  <div className="px-5 py-4 border-t border-[#E8EBF0] flex items-center justify-between">
                    <div className="w-full bg-[#E8EBF0] rounded-full h-1.5 mr-4">
                      <div
                        className="bg-brand-green h-1.5 rounded-full transition-all"
                        style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {close.status === "open" && allDone && (
                        <form action={submitForApproval.bind(null, close.id)}>
                          <button type="submit" className="btn-secondary text-xs">
                            Wyślij do zatwierdzenia
                          </button>
                        </form>
                      )}
                      {close.status === "in_review" && role === "owner_cfo" && (
                        <form action={approveMonthClose.bind(null, close.id)}>
                          <button type="submit" className="btn-primary text-xs">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Zatwierdź miesiąc
                          </button>
                        </form>
                      )}
                      {close.status === "approved" && (
                        <span className="text-xs text-brand-green flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          Zatwierdzone przez CFO
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : close?.status === "locked" ? (
                <div className="px-5 py-6 flex items-center gap-2 text-brand-subtle">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Miesiąc zablokowany</span>
                </div>
              ) : !close ? (
                <EmptyState
                  icon={Calendar}
                  title="Zamknięcie nie zostało otwarte"
                  description="Kliknij 'Otwórz zamknięcie' aby rozpocząć checklistę."
                  className="py-8"
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
