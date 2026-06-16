import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Plus, Settings2 } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Integracje" }

const SOURCE_TYPE_LABELS: Record<string, string> = {
  lessons_app: "Aplikacja uNick Academy",
  wfirma:      "wFirma",
  bank:        "Bank (CSV)",
  ksef:        "KSeF",
  manual:      "Ręczny import",
}

export default async function IntegracjePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: sources } = await supabase
    .schema("ufos")
    .from("integration_sources")
    .select("*")
    .order("created_at")

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-500">Integracje</h1>
          <p className="text-sm text-brand-subtle mt-1">
            Źródła danych i konfiguracja mapowania pól
          </p>
        </div>
        <a href="/ustawienia/integracje/nowe" className="btn-primary">
          <Plus className="w-4 h-4" />
          Dodaj źródło
        </a>
      </div>

      <div className="space-y-3">
        {!sources || sources.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Settings2}
              title="Brak źródeł danych"
              description="Dodaj pierwsze źródło danych, aby skonfigurować import z aplikacji uNick Academy."
              action={
                <a href="/ustawienia/integracje/nowe" className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Dodaj źródło
                </a>
              }
            />
          </div>
        ) : (
          sources.map((source) => (
            <div key={source.id} className="card flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-navy-500">{source.name}</h3>
                  <span className="pill-subtle">
                    {SOURCE_TYPE_LABELS[source.type] ?? source.type}
                  </span>
                  {source.active ? (
                    <span className="pill-green">Aktywne</span>
                  ) : (
                    <span className="pill-subtle">Nieaktywne</span>
                  )}
                </div>
              </div>
              <a
                href={`/ustawienia/integracje/${source.id}`}
                className="btn-secondary text-xs"
              >
                Konfiguruj
              </a>
            </div>
          ))
        )}
      </div>

      {/* Dostępne integracje – placeholder */}
      <div className="mt-8">
        <h2 className="text-xs font-semibold text-brand-subtle uppercase tracking-wide mb-4">
          Dostępne integracje
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(SOURCE_TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="card flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium text-navy-500">{label}</p>
                <p className="text-xs text-brand-subtle mt-0.5">
                  {type === "lessons_app" ? "CSV / API" :
                   type === "bank" ? "CSV wyciąg" :
                   type === "ksef" ? "Placeholder" : "W przygotowaniu"}
                </p>
              </div>
              <a
                href={`/ustawienia/integracje/nowe?type=${type}`}
                className="btn-secondary text-xs"
              >
                <Plus className="w-3 h-3" />
                Dodaj
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
