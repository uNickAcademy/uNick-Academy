import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getHighestRole } from "@/lib/auth/session"
import { MetricCard } from "@/components/shared/MetricCard"
import { EmptyState } from "@/components/shared/EmptyState"
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowDownToLine,
  Users,
  BookOpen,
} from "lucide-react"
import type { Metadata } from "next"
import type { UserEntityRole } from "@/types/domain"

export const metadata: Metadata = { title: "Dashboard CFO" }

export default async function CfoDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: roles } = await supabase
    .schema("ufos")
    .from("user_entity_roles")
    .select("*")
    .eq("user_id", user.id)

  const role = getHighestRole((roles ?? []) as UserEntityRole[])
  if (role !== "owner_cfo") redirect("/dashboard/ops")

  // Sprawdź czy są importy
  const { count: importCount } = await supabase
    .schema("ufos")
    .from("import_batches")
    .select("*", { count: "exact", head: true })
    .eq("status", "imported")

  const hasData = (importCount ?? 0) > 0

  return (
    <div className="max-w-6xl mx-auto">
      {/* Nagłówek */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Dashboard CFO</h1>
        <p className="text-sm text-brand-subtle mt-1">
          {new Date().toLocaleDateString("pl-PL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {!hasData ? (
        /* Stan startowy – brak danych */
        <div className="card">
          <EmptyState
            icon={ArrowDownToLine}
            title="Brak danych lekcyjnych"
            description="Zaimportuj dane z aplikacji uNick Academy, aby zobaczyć przychody, koszty i rentowność."
            action={
              <a href="/import" className="btn-primary">
                Importuj dane
              </a>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 3 kluczowe liczby */}
          <section>
            <h2 className="text-xs font-semibold text-brand-subtle uppercase tracking-wide mb-3">
              Kluczowe liczby – ten miesiąc
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                title="Przychody z lekcji"
                value="—"
                subtitle="Dane po pierwszym imporcie"
                icon={TrendingUp}
                variant="default"
              />
              <MetricCard
                title="Koszty nauczycieli"
                value="—"
                subtitle="Dane po pierwszym imporcie"
                icon={Users}
                variant="default"
              />
              <MetricCard
                title="Marża brutto"
                value="—"
                subtitle="Dane po pierwszym imporcie"
                icon={CheckCircle2}
                variant="default"
              />
            </div>
          </section>

          {/* 3 ryzyka */}
          <section>
            <h2 className="text-xs font-semibold text-brand-subtle uppercase tracking-wide mb-3">
              Ryzyka
            </h2>
            <div className="space-y-2">
              <EmptyState
                icon={AlertTriangle}
                title="Brak aktywnych ryzyk"
                description="Ryzyka pojawią się po zaimportowaniu danych i uruchomieniu analizy AI."
              />
            </div>
          </section>

          {/* 3 decyzje */}
          <section>
            <h2 className="text-xs font-semibold text-brand-subtle uppercase tracking-wide mb-3">
              Decyzje do zatwierdzenia
            </h2>
            <EmptyState
              icon={CheckCircle2}
              title="Brak oczekujących decyzji"
            />
          </section>

          {/* Rentowność kursów */}
          <section>
            <h2 className="text-xs font-semibold text-brand-subtle uppercase tracking-wide mb-3">
              Top kursy – rentowność
            </h2>
            <div className="card">
              <EmptyState
                icon={BookOpen}
                title="Dane po imporcie lekcji"
                description="Zaimportuj dane, aby zobaczyć rentowność per kurs i grupę."
              />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
