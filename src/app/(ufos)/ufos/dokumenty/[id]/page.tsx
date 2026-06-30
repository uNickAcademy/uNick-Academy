import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { updateDocumentStatus } from "../actions"
import { StatusPill } from "@/app/components/ufos/shared/StatusPill"
import { formatDate, formatDateTime, formatPLN } from "@/lib/ufos/formatters"
import { FileText, CheckCircle, XCircle, Download } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Dokument" }

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice_in: "Faktura zakup", invoice_out: "Faktura sprzedaż",
  contract: "Umowa", tax_return: "Deklaracja podatkowa",
  payroll: "Dokument płacowy", bank_statement: "Wyciąg bankowy", other: "Inne",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Oczekuje", reviewed: "Sprawdzone",
  approved: "Zatwierdzone", rejected: "Odrzucone", archived: "Zarchiwizowane",
}

const STATUS_VARIANT = (s: string): "green" | "amber" | "red" | "subtle" =>
  s === "approved" ? "green" : s === "reviewed" ? "amber" : s === "rejected" ? "red" : "subtle"

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: doc } = await supabase
    .schema("ufos")
    .from("documents")
    .select("*")
    .eq("id", id)
    .single()

  if (!doc) notFound()

  let downloadUrl: string | null = null
  if (doc.storage_path) {
    const { data: urlData } = await supabase.storage
      .from("ufos-documents")
      .createSignedUrl(doc.storage_path, 300)
    downloadUrl = urlData?.signedUrl ?? null
  }

  const markReviewed = updateDocumentStatus.bind(null, id, "reviewed")
  const markApproved = updateDocumentStatus.bind(null, id, "approved")
  const markRejected = updateDocumentStatus.bind(null, id, "rejected")

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/ufos/dokumenty" className="text-sm text-brand-subtle hover:text-navy-500">
          ← Dokumenty
        </Link>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-navy-400 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-bold text-navy-500">{doc.title}</h1>
              <p className="text-sm text-brand-subtle">{DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}</p>
            </div>
          </div>
          <StatusPill
            label={STATUS_LABELS[doc.status] ?? doc.status}
            variant={STATUS_VARIANT(doc.status)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
          {doc.counterparty && (
            <div>
              <p className="text-xs text-brand-subtle mb-0.5">Kontrahent</p>
              <p className="font-medium text-navy-500">{doc.counterparty}</p>
            </div>
          )}
          {doc.amount != null && (
            <div>
              <p className="text-xs text-brand-subtle mb-0.5">Kwota</p>
              <p className="font-semibold text-navy-500">{formatPLN(Number(doc.amount))}</p>
            </div>
          )}
          {doc.document_date && (
            <div>
              <p className="text-xs text-brand-subtle mb-0.5">Data dokumentu</p>
              <p className="font-medium text-navy-500">{formatDate(doc.document_date)}</p>
            </div>
          )}
          {doc.due_date && (
            <div>
              <p className="text-xs text-brand-subtle mb-0.5">Termin płatności</p>
              <p className={`font-medium ${new Date(doc.due_date) < new Date() ? "text-brand-red" : "text-navy-500"}`}>
                {formatDate(doc.due_date)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-brand-subtle mb-0.5">Dodano</p>
            <p className="text-navy-500">{formatDateTime(doc.created_at)}</p>
          </div>
          {doc.reviewed_at && (
            <div>
              <p className="text-xs text-brand-subtle mb-0.5">Zweryfikowano</p>
              <p className="text-navy-500">{formatDateTime(doc.reviewed_at)}</p>
            </div>
          )}
        </div>

        {doc.description && (
          <div className="mb-5 p-3 bg-brand-muted rounded-md">
            <p className="text-sm text-navy-500">{doc.description}</p>
          </div>
        )}

        {/* Plik */}
        {doc.file_name && (
          <div className="flex items-center justify-between p-3 border border-[#E8EBF0] rounded-md mb-5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy-400" />
              <div>
                <p className="text-sm font-medium text-navy-500">{doc.file_name}</p>
                {doc.file_size && (
                  <p className="text-xs text-brand-subtle">{(doc.file_size / 1024).toFixed(0)} KB</p>
                )}
              </div>
            </div>
            {downloadUrl && (
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                <Download className="w-3.5 h-3.5" />
                Pobierz
              </a>
            )}
          </div>
        )}

        {/* Akcje statusu */}
        {doc.status !== "approved" && doc.status !== "archived" && (
          <div className="flex items-center gap-3 pt-4 border-t border-[#E8EBF0]">
            {doc.status === "pending" && (
              <form action={markReviewed}>
                <button type="submit" className="btn-secondary text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Oznacz sprawdzone
                </button>
              </form>
            )}
            {(doc.status === "pending" || doc.status === "reviewed") && (
              <form action={markApproved}>
                <button type="submit" className="btn-primary text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Zatwierdź
                </button>
              </form>
            )}
            {doc.status !== "rejected" && (
              <form action={markRejected}>
                <button type="submit" className="text-sm text-brand-red hover:underline flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  Odrzuć
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
