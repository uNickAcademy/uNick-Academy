import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CheckSquare, Plus, Clock, AlertTriangle } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusPill } from "@/components/shared/StatusPill"
import { formatDate } from "@/lib/utils/formatters"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Zadania" }

const CATEGORY_LABELS: Record<string, string> = {
  tax:           "Podatki",
  payroll:       "Płace",
  accounting:    "Księgowość",
  legal:         "Prawne",
  operational:   "Operacyjne",
  other:         "Inne",
}

const PRIORITY_VARIANT = (p: string): "red" | "amber" | "subtle" | "green" => {
  if (p === "urgent") return "red"
  if (p === "high")   return "amber"
  if (p === "low")    return "subtle"
  return "subtle"
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Pilne",
  high:   "Wysoki",
  medium: "Normalny",
  low:    "Niski",
}

const STATUS_LABELS: Record<string, string> = {
  open:        "Otwarte",
  in_progress: "W toku",
  done:        "Ukończone",
  cancelled:   "Anulowane",
}

const STATUS_VARIANT = (s: string): "green" | "amber" | "red" | "subtle" => {
  if (s === "done")        return "green"
  if (s === "in_progress") return "amber"
  if (s === "cancelled")   return "subtle"
  return "subtle"
}

export default async function ZadaniaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: openTasks } = await supabase
    .schema("ufos")
    .from("tasks")
    .select("id, title, category, priority, status, due_date, entity_id")
    .in("status", ["open", "in_progress"])
    .order("due_date", { ascending: true, nullsFirst: false })

  const { data: doneTasks } = await supabase
    .schema("ufos")
    .from("tasks")
    .select("id, title, category, priority, status, due_date, completed_at")
    .eq("status", "done")
    .order("completed_at", { ascending: false })
    .limit(10)

  const overdue = (openTasks ?? []).filter(
    (t) => t.due_date && new Date(t.due_date) < new Date()
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-500">Zadania</h1>
          <p className="text-sm text-brand-subtle mt-1">Lista zadań i terminów operacyjnych</p>
        </div>
        <Link href="/zadania/nowe" className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          Nowe zadanie
        </Link>
      </div>

      {/* Alerty – przeterminowane */}
      {overdue.length > 0 && (
        <div className="card border-l-4 border-l-brand-red mb-6 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-brand-red shrink-0" />
            <p className="text-sm font-medium text-navy-500">
              {overdue.length} {overdue.length === 1 ? "zadanie przeterminowane" : "zadania przeterminowane"}
            </p>
          </div>
        </div>
      )}

      {/* Aktywne zadania */}
      <div className="card p-0 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-[#E8EBF0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-500">Aktywne</h2>
          <span className="text-xs text-brand-subtle">{openTasks?.length ?? 0} zadań</span>
        </div>

        {!openTasks || openTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="Brak aktywnych zadań"
            description="Dodaj pierwsze zadanie klikając 'Nowe zadanie'."
            action={
              <Link href="/zadania/nowe" className="btn-primary text-sm">
                <Plus className="w-4 h-4" />
                Nowe zadanie
              </Link>
            }
            className="py-10"
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-muted">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-brand-subtle">Zadanie</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-subtle">Kategoria</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-brand-subtle">Priorytet</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-brand-subtle">Status</th>
                <th className="text-right py-3 px-6 text-xs font-medium text-brand-subtle">Termin</th>
              </tr>
            </thead>
            <tbody>
              {openTasks.map((t) => {
                const isOverdue = t.due_date && new Date(t.due_date) < new Date()
                return (
                  <tr key={t.id} className="border-t border-[#E8EBF0] hover:bg-brand-muted/40">
                    <td className="py-3 px-6">
                      <Link href={`/zadania/${t.id}`} className="font-medium text-navy-500 hover:underline">
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-brand-subtle text-xs">
                      {CATEGORY_LABELS[t.category] ?? t.category}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.priority !== "medium" && (
                        <StatusPill
                          label={PRIORITY_LABELS[t.priority] ?? t.priority}
                          variant={PRIORITY_VARIANT(t.priority)}
                        />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusPill
                        label={STATUS_LABELS[t.status] ?? t.status}
                        variant={STATUS_VARIANT(t.status)}
                      />
                    </td>
                    <td className={`py-3 px-6 text-right text-xs ${isOverdue ? "text-brand-red font-medium" : "text-brand-subtle"}`}>
                      {t.due_date ? formatDate(t.due_date) : "—"}
                      {isOverdue && " ⚠"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Ostatnio ukończone */}
      {doneTasks && doneTasks.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8EBF0]">
            <h2 className="text-sm font-semibold text-navy-500">Ostatnio ukończone</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {doneTasks.map((t) => (
                <tr key={t.id} className="border-t border-[#E8EBF0] hover:bg-brand-muted/40">
                  <td className="py-2.5 px-6">
                    <span className="text-brand-subtle line-through">{t.title}</span>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-brand-subtle">
                    {CATEGORY_LABELS[t.category] ?? t.category}
                  </td>
                  <td className="py-2.5 px-6 text-right text-xs text-brand-subtle">
                    {t.completed_at ? formatDate(t.completed_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
