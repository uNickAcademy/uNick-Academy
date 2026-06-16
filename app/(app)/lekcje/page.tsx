import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { formatDate, formatPLN, formatPercent } from "@/lib/utils/formatters"
import { BookOpen, Clock, Users } from "lucide-react"
import { StatusPill } from "@/components/shared/StatusPill"
import { EmptyState } from "@/components/shared/EmptyState"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Lekcje" }

const attendanceLabel: Record<string, string> = {
  scheduled: "Zaplanowana",
  present:   "Zrealizowana",
  absent:    "Nieobecność",
  excused:   "Usprawiedliwiona",
}

const attendanceVariant = (status: string): "green" | "amber" | "red" | "subtle" => {
  if (status === "present")  return "green"
  if (status === "absent")   return "red"
  if (status === "excused")  return "amber"
  return "subtle"
}

export default async function LekcjePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Ostatnie 50 lekcji
  const { data: lessons } = await supabase
    .schema("ufos")
    .from("lesson_analytics")
    .select("id, lesson_date, starts_at, lesson_status, lesson_format, location_type, student_name, teacher_name, group_name, price_per_lesson, teacher_cost, gross_margin, duration_hours")
    .order("starts_at", { ascending: false })
    .limit(50)

  // Statystyki bieżącego miesiąca
  const currentMonth = new Date()
  currentMonth.setDate(1)

  const { data: monthStats } = await supabase
    .schema("ufos")
    .from("monthly_summary")
    .select("*")
    .eq("period", currentMonth.toISOString().slice(0, 10))
    .single()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-500">Lekcje</h1>
          <p className="text-sm text-brand-subtle mt-1">Historia i analiza lekcji w czasie rzeczywistym</p>
        </div>
        <Link href="/lekcje/rentownosc" className="btn-secondary text-sm">
          <BookOpen className="w-4 h-4" />
          Rentowność
        </Link>
      </div>

      {/* Szybkie liczby */}
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
            <p className="text-xs text-brand-subtle mb-1">Odwołane</p>
            <p className="text-xl font-bold text-brand-red">{monthStats.missed_lessons ?? 0}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Marża brutto</p>
            <p className="text-xl font-bold text-brand-green">{formatPLN(Number(monthStats.total_margin ?? 0))}</p>
          </div>
        </div>
      )}

      {/* Tabela lekcji */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8EBF0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-500">Ostatnie lekcje</h2>
          <span className="text-xs text-brand-subtle">50 najnowszych</span>
        </div>

        {!lessons || lessons.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Brak lekcji"
            description="Lekcje pojawią się gdy nauczyciele zaczną je dodawać w aplikacji"
            className="py-10"
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-muted">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-brand-subtle">Data</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-subtle">Uczeń / Grupa</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-subtle">Nauczyciel</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-brand-subtle">Typ</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-brand-subtle">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-subtle">Marża</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => (
                <tr key={l.id} className="border-t border-[#E8EBF0] hover:bg-brand-muted/40">
                  <td className="py-2.5 px-6 text-brand-subtle">
                    {formatDate(l.lesson_date)}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-medium text-navy-500">
                      {l.group_name ?? l.student_name ?? "—"}
                    </span>
                    {l.group_name && l.lesson_format === "group" && (
                      <span className="ml-1 text-xs text-brand-subtle">(gr.)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-brand-subtle">{l.teacher_name ?? "—"}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="text-xs text-brand-subtle capitalize">
                      {l.location_type === "online" ? "🌐 Online" : "📍 Stacj."}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <StatusPill
                      label={attendanceLabel[l.lesson_status ?? ""] ?? l.lesson_status ?? "—"}
                      variant={attendanceVariant(l.lesson_status ?? "")}
                    />
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {l.lesson_status === "present" ? (
                      <span className={`font-medium text-sm ${Number(l.gross_margin ?? 0) >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                        {formatPLN(Number(l.gross_margin ?? 0))}
                      </span>
                    ) : (
                      <span className="text-brand-subtle text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Link href="/lekcje/zaleglosci" className="text-sm text-brand-red hover:underline flex items-center gap-1">
          <Users className="w-4 h-4" />
          Zaległości płatnicze
        </Link>
        <Link href="/lekcje/rentownosc" className="btn-secondary text-sm">
          Rentowność →
        </Link>
      </div>
    </div>
  )
}
