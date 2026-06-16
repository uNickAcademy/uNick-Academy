import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FileText, Plus, Upload } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusPill } from "@/components/shared/StatusPill"
import { formatDate, formatPLN } from "@/lib/utils/formatters"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Dokumenty" }

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice_in:     "Faktura zakup",
  invoice_out:    "Faktura sprzedaż",
  contract:       "Umowa",
  tax_return:     "Deklaracja",
  payroll:        "Płace",
  bank_statement: "Wyciąg bankowy",
  other:          "Inne",
}

const STATUS_VARIANT = (s: string): "green" | "amber" | "red" | "subtle" => {
  if (s === "approved")  return "green"
  if (s === "reviewed")  return "amber"
  if (s === "rejected")  return "red"
  if (s === "archived")  return "subtle"
  return "subtle"
}

const STATUS_LABELS: Record<string, string> = {
  pending:  "Oczekuje",
  reviewed: "Sprawdzone",
  approved: "Zatwierdzone",
  rejected: "Odrzucone",
  archived: "Zarchiwizowane",
}

export default async function DokumentyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: documents } = await supabase
    .schema("ufos")
    .from("documents")
    .select("id, title, document_type, status, amount, currency, document_date, counterparty, file_name")
    .order("document_date", { ascending: false, nullsFirst: false })
    .limit(50)

  const pendingCount = (documents ?? []).filter((d) => d.status === "pending").length

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-500">Dokumenty</h1>
          <p className="text-sm text-brand-subtle mt-1">Faktury, umowy, deklaracje i inne dokumenty</p>
        </div>
        <Link href="/dokumenty/nowy" className="btn-primary text-sm">
          <Upload className="w-4 h-4" />
          Dodaj dokument
        </Link>
      </div>

      {pendingCount > 0 && (
        <div className="card border-l-4 border-l-brand-amber mb-6 py-4">
          <p className="text-sm font-medium text-navy-500">
            {pendingCount} {pendingCount === 1 ? "dokument czeka" : "dokumenty czekają"} na weryfikację
          </p>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8EBF0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-500">Wszystkie dokumenty</h2>
          <span className="text-xs text-brand-subtle">{documents?.length ?? 0} dokumentów</span>
        </div>

        {!documents || documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Brak dokumentów"
            description="Dodaj pierwszy dokument klikając 'Dodaj dokument'."
            action={
              <Link href="/dokumenty/nowy" className="btn-primary text-sm">
                <Upload className="w-4 h-4" />
                Dodaj dokument
              </Link>
            }
            className="py-12"
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-muted">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-brand-subtle">Dokument</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-subtle">Typ</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-subtle">Kontrahent</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-brand-subtle">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-subtle">Kwota</th>
                <th className="text-right py-3 px-6 text-xs font-medium text-brand-subtle">Data</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-t border-[#E8EBF0] hover:bg-brand-muted/40">
                  <td className="py-3 px-6">
                    <Link href={`/dokumenty/${d.id}`} className="font-medium text-navy-500 hover:underline">
                      {d.title}
                    </Link>
                    {d.file_name && (
                      <p className="text-xs text-brand-subtle mt-0.5 truncate max-w-[200px]">{d.file_name}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-brand-subtle">
                    {DOC_TYPE_LABELS[d.document_type] ?? d.document_type}
                  </td>
                  <td className="py-3 px-4 text-brand-subtle text-xs">
                    {d.counterparty ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusPill
                      label={STATUS_LABELS[d.status] ?? d.status}
                      variant={STATUS_VARIANT(d.status)}
                    />
                  </td>
                  <td className="py-3 px-4 text-right text-navy-500">
                    {d.amount != null ? formatPLN(Number(d.amount)) : "—"}
                  </td>
                  <td className="py-3 px-6 text-right text-brand-subtle text-xs">
                    {d.document_date ? formatDate(d.document_date) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
