import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EmptyState } from "@/components/shared/EmptyState"
import { ArrowDownToLine, Plus } from "lucide-react"
import { formatDate } from "@/lib/utils/formatters"
import { StatusPill } from "@/components/shared/StatusPill"
import type { Metadata } from "next"
import type { ImportBatchStatus } from "@/types/domain"
import { IMPORT_STATUS_LABELS, STATUS_COLORS } from "@/types/domain"

export const metadata: Metadata = { title: "Import danych" }

export default async function ImportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: batches } = await supabase
    .schema("ufos")
    .from("import_batches")
    .select(`
      id, file_name, status, record_count, valid_count, error_count,
      started_at, completed_at,
      integration_sources (name, type)
    `)
    .order("started_at", { ascending: false })
    .limit(20)

  const { data: sources } = await supabase
    .schema("ufos")
    .from("integration_sources")
    .select("id, name, type")
    .eq("active", true)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-500">Import danych</h1>
          <p className="text-sm text-brand-subtle mt-1">
            Importuj dane z aplikacji uNick Academy i innych źródeł
          </p>
        </div>
        <a href="/import/nowy" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nowy import
        </a>
      </div>

      {/* Źródła integracji */}
      {sources && sources.length === 0 && (
        <div className="card mb-6">
          <EmptyState
            icon={ArrowDownToLine}
            title="Brak skonfigurowanych źródeł"
            description="Skonfiguruj źródło danych (np. aplikację uNick Academy), aby rozpocząć import."
            action={
              <a href="/ustawienia/integracje" className="btn-primary">
                Konfiguruj integracje
              </a>
            }
          />
        </div>
      )}

      {/* Historia importów */}
      <div className="card">
        <h2 className="text-sm font-semibold text-navy-500 mb-4">Historia importów</h2>

        {!batches || batches.length === 0 ? (
          <EmptyState
            icon={ArrowDownToLine}
            title="Brak importów"
            description="Pierwsze dane pojawią się tu po wykonaniu importu CSV."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8EBF0]">
                <th className="text-left py-2 text-xs font-medium text-brand-subtle">Plik</th>
                <th className="text-left py-2 text-xs font-medium text-brand-subtle">Źródło</th>
                <th className="text-left py-2 text-xs font-medium text-brand-subtle">Status</th>
                <th className="text-right py-2 text-xs font-medium text-brand-subtle">Rekordy</th>
                <th className="text-right py-2 text-xs font-medium text-brand-subtle">Błędy</th>
                <th className="text-left py-2 text-xs font-medium text-brand-subtle">Data</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
                const srcRaw = batch.integration_sources
                const src = srcRaw && !Array.isArray(srcRaw)
                  ? (srcRaw as { name: string; type: string })
                  : Array.isArray(srcRaw) && srcRaw.length > 0
                    ? (srcRaw[0] as { name: string; type: string })
                    : null
                const status = batch.status as ImportBatchStatus
                const colorKey = STATUS_COLORS[status] as "green" | "amber" | "red" | "subtle"
                return (
                  <tr key={batch.id} className="border-b border-[#E8EBF0] last:border-0 hover:bg-brand-muted/40">
                    <td className="py-3 font-medium text-navy-500">
                      {batch.file_name ?? "—"}
                    </td>
                    <td className="py-3 text-brand-subtle">{src?.name ?? "—"}</td>
                    <td className="py-3">
                      <StatusPill
                        label={IMPORT_STATUS_LABELS[status] ?? status}
                        variant={colorKey ?? "subtle"}
                      />
                    </td>
                    <td className="py-3 text-right text-brand-subtle">{batch.record_count ?? 0}</td>
                    <td className="py-3 text-right">
                      {(batch.error_count ?? 0) > 0 ? (
                        <span className="text-brand-red font-medium">{batch.error_count}</span>
                      ) : (
                        <span className="text-brand-subtle">0</span>
                      )}
                    </td>
                    <td className="py-3 text-brand-subtle">{formatDate(batch.started_at)}</td>
                    <td className="py-3 text-right">
                      <a
                        href={`/import/${batch.id}`}
                        className="text-xs text-navy-500 hover:underline"
                      >
                        Szczegóły →
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
