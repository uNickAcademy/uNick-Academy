import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { formatPLN, formatDate } from "@/lib/utils/formatters"
import { AlertTriangle } from "lucide-react"
import { StatusPill } from "@/components/shared/StatusPill"
import { EmptyState } from "@/components/shared/EmptyState"
import type { Metadata } from "next"
import type { PaymentStatus } from "@/types/domain"
import { PAYMENT_STATUS_LABELS } from "@/types/domain"
import Link from "next/link"

export const metadata: Metadata = { title: "Zaległości płatnicze" }

const statusVariant = (status: string): "green" | "amber" | "red" | "subtle" => {
  if (status === "overdue") return "red"
  if (status === "active")  return "subtle"
  if (status === "trial")   return "amber"
  if (status === "paused")  return "subtle"
  return "subtle"
}

const studentStatusLabel: Record<string, string> = {
  active:  "Aktywny",
  trial:   "Próbny",
  overdue: "Zaległy",
  paused:  "Wstrzymany",
}

export default async function ZaleglosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Uczniowie z ujemnym lub zerowym saldem
  const { data: debtors } = await supabase
    .schema("ufos")
    .from("students_with_debt")
    .select("*")
    .lt("credit_balance", 0)
    .order("credit_balance", { ascending: true })

  // Uczniowie ze statusem 'overdue' (nawet jeśli saldo > 0)
  const { data: overdueStudents } = await supabase
    .schema("ufos")
    .from("students_with_debt")
    .select("*")
    .eq("status", "overdue")
    .gt("credit_balance", 0)

  const allDebtors = [
    ...(debtors ?? []),
    ...(overdueStudents ?? []),
  ]

  const totalDebt = (debtors ?? []).reduce((sum, d) => sum + Math.abs(Number(d.credit_balance) || 0), 0)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Zaległości płatnicze</h1>
        <p className="text-sm text-brand-subtle mt-1">
          Uczniowie z ujemnym saldem lub statusem zaległości
        </p>
      </div>

      {/* Podsumowanie */}
      {allDebtors.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card border-l-4 border-l-brand-red py-4">
            <p className="text-xs font-medium text-brand-subtle uppercase tracking-wide">Łączne zaległości</p>
            <p className="text-2xl font-bold text-brand-red mt-1">{formatPLN(totalDebt)}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs font-medium text-brand-subtle uppercase tracking-wide">Uczniów z zaległościami</p>
            <p className="text-2xl font-bold text-navy-500 mt-1">{(debtors?.length ?? 0)}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs font-medium text-brand-subtle uppercase tracking-wide">Ze statusem zaległy</p>
            <p className="text-2xl font-bold text-brand-amber mt-1">{(overdueStudents?.length ?? 0) + (debtors?.filter(d => d.status === 'overdue').length ?? 0)}</p>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8EBF0]">
          <h2 className="text-sm font-semibold text-navy-500">Lista uczniów</h2>
        </div>

        {allDebtors.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Brak zaległości"
            description="Wszyscy uczniowie mają uregulowane płatności."
            className="py-10"
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-muted">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-brand-subtle">Uczeń</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-subtle">Nauczyciel</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-subtle">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-subtle">Saldo</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-subtle">Nadchodzące</th>
                <th className="text-right py-3 px-6 text-xs font-medium text-brand-subtle">Ostatnia lekcja</th>
              </tr>
            </thead>
            <tbody>
              {allDebtors.map((d) => (
                <tr key={d.id} className="border-t border-[#E8EBF0] hover:bg-brand-muted/40">
                  <td className="py-3 px-6">
                    <span className="font-medium text-navy-500">{d.student_name ?? "—"}</span>
                    {d.credit_balance < 0 && (
                      <AlertTriangle className="w-3 h-3 text-brand-red inline ml-1 mb-0.5" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-brand-subtle">{d.teacher_name ?? "—"}</td>
                  <td className="py-3 px-4">
                    <StatusPill
                      label={studentStatusLabel[d.status ?? ""] ?? d.status ?? "—"}
                      variant={statusVariant(d.status ?? "")}
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-semibold ${Number(d.credit_balance) < 0 ? "text-brand-red" : "text-navy-500"}`}>
                      {formatPLN(Number(d.credit_balance))}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-brand-subtle">
                    {d.upcoming_lessons ?? 0} lekcji
                  </td>
                  <td className="py-3 px-6 text-right text-brand-subtle">
                    {d.last_lesson_at ? formatDate(d.last_lesson_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Link href="/lekcje" className="btn-secondary text-sm">← Powrót do lekcji</Link>
      </div>
    </div>
  )
}
