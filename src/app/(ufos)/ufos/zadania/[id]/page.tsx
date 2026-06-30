import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { updateTaskStatus } from "../actions"
import { StatusPill } from "@/app/components/ufos/shared/StatusPill"
import { formatDate, formatDateTime } from "@/lib/ufos/formatters"
import { CheckSquare, Clock, AlertTriangle } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Zadanie" }

const CATEGORY_LABELS: Record<string, string> = {
  tax: "Podatki", payroll: "Płace", accounting: "Księgowość",
  legal: "Prawne", operational: "Operacyjne", other: "Inne",
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Pilne", high: "Wysoki", medium: "Normalny", low: "Niski",
}

const STATUS_LABELS: Record<string, string> = {
  open: "Otwarte", in_progress: "W toku", done: "Ukończone", cancelled: "Anulowane",
}

const STATUS_VARIANT = (s: string): "green" | "amber" | "red" | "subtle" =>
  s === "done" ? "green" : s === "in_progress" ? "amber" : "subtle"

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: task } = await supabase
    .schema("ufos")
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single()

  if (!task) notFound()

  const isOverdue = task.status !== "done" && task.due_date && new Date(task.due_date) < new Date()

  const markDone = updateTaskStatus.bind(null, id, "done")
  const markInProgress = updateTaskStatus.bind(null, id, "in_progress")
  const markOpen = updateTaskStatus.bind(null, id, "open")

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/ufos/zadania" className="text-sm text-brand-subtle hover:text-navy-500">
          ← Zadania
        </Link>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-navy-500">{task.title}</h1>
            {isOverdue && (
              <div className="flex items-center gap-1.5 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-brand-red" />
                <span className="text-xs text-brand-red font-medium">Przeterminowane</span>
              </div>
            )}
          </div>
          <StatusPill
            label={STATUS_LABELS[task.status] ?? task.status}
            variant={STATUS_VARIANT(task.status)}
          />
        </div>

        {task.description && (
          <p className="text-sm text-brand-subtle mb-6 leading-relaxed">{task.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-xs text-brand-subtle mb-0.5">Kategoria</p>
            <p className="font-medium text-navy-500">{CATEGORY_LABELS[task.category] ?? task.category}</p>
          </div>
          <div>
            <p className="text-xs text-brand-subtle mb-0.5">Priorytet</p>
            <p className="font-medium text-navy-500">{PRIORITY_LABELS[task.priority] ?? task.priority}</p>
          </div>
          <div>
            <p className="text-xs text-brand-subtle mb-0.5">Termin</p>
            <p className={`font-medium ${isOverdue ? "text-brand-red" : "text-navy-500"}`}>
              {task.due_date ? formatDate(task.due_date) : "Brak terminu"}
            </p>
          </div>
          <div>
            <p className="text-xs text-brand-subtle mb-0.5">Utworzone</p>
            <p className="font-medium text-navy-500">{formatDateTime(task.created_at)}</p>
          </div>
          {task.completed_at && (
            <div>
              <p className="text-xs text-brand-subtle mb-0.5">Ukończone</p>
              <p className="font-medium text-brand-green">{formatDateTime(task.completed_at)}</p>
            </div>
          )}
        </div>

        {task.status !== "done" && task.status !== "cancelled" && (
          <div className="flex items-center gap-3 pt-4 border-t border-[#E8EBF0]">
            {task.status === "open" && (
              <form action={markInProgress}>
                <button type="submit" className="btn-secondary text-sm">
                  <Clock className="w-4 h-4" />
                  Rozpocznij
                </button>
              </form>
            )}
            {task.status === "in_progress" && (
              <form action={markOpen}>
                <button type="submit" className="btn-secondary text-sm">
                  Wróć do otwartych
                </button>
              </form>
            )}
            <form action={markDone}>
              <button type="submit" className="btn-primary text-sm">
                <CheckSquare className="w-4 h-4" />
                Oznacz jako ukończone
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
