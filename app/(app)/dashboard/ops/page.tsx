import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getHighestRole } from "@/lib/auth/session"
import { EmptyState } from "@/components/shared/EmptyState"
import { CheckSquare, ArrowDownToLine, AlertCircle } from "lucide-react"
import type { Metadata } from "next"
import type { UserEntityRole } from "@/types/domain"

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

  // Importy wymagające uwagi
  const { data: pendingImports } = await supabase
    .schema("ufos")
    .from("import_batches")
    .select("id, file_name, status, error_count, started_at")
    .in("status", ["staged", "failed", "validating"])
    .order("started_at", { ascending: false })
    .limit(5)

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zadania na dziś */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-4 h-4 text-navy-400" />
            <h2 className="text-sm font-semibold text-navy-500">Zadania na dziś</h2>
          </div>
          <EmptyState
            title="Brak zadań na dziś"
            description="Zadania pojawią się po skonfigurowaniu terminów i checklisty."
          />
        </div>

        {/* Importy do sprawdzenia */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownToLine className="w-4 h-4 text-navy-400" />
            <h2 className="text-sm font-semibold text-navy-500">Importy do sprawdzenia</h2>
          </div>
          {pendingImports && pendingImports.length > 0 ? (
            <ul className="space-y-2">
              {pendingImports.map((batch) => (
                <li key={batch.id} className="flex items-center justify-between py-2 border-b border-[#E8EBF0] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-navy-500">
                      {batch.file_name ?? "Import bez nazwy"}
                    </p>
                    <p className="text-xs text-brand-subtle">
                      {batch.error_count} błędów · {batch.status}
                    </p>
                  </div>
                  <a
                    href={`/import/${batch.id}`}
                    className="text-xs text-navy-500 hover:underline"
                  >
                    Sprawdź →
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={ArrowDownToLine}
              title="Brak oczekujących importów"
              action={
                <a href="/import" className="btn-secondary text-sm">
                  Nowy import
                </a>
              }
            />
          )}
        </div>

        {/* Braki i problemy */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-brand-amber" />
            <h2 className="text-sm font-semibold text-navy-500">Do wyjaśnienia</h2>
          </div>
          <EmptyState
            title="Brak problemów"
            description="Problemy z dokumentami i płatnościami pojawią się tutaj."
          />
        </div>

        {/* Szybki dostęp */}
        <div className="card">
          <h2 className="text-sm font-semibold text-navy-500 mb-4">Szybki dostęp</h2>
          <div className="grid grid-cols-2 gap-2">
            <a href="/import" className="btn-secondary justify-center text-xs py-3 flex-col gap-1 h-auto">
              <ArrowDownToLine className="w-4 h-4" />
              Import danych
            </a>
            <a href="/lekcje" className="btn-secondary justify-center text-xs py-3 flex-col gap-1 h-auto">
              <CheckSquare className="w-4 h-4" />
              Lekcje
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
