import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Landmark, Upload, Plus, ArrowDownToLine, CheckCircle2, AlertCircle } from "lucide-react"
import { formatPLN, formatDateTime } from "@/lib/utils/formatters"
import { MatchRow, type Debtor, type TxRow } from "./MatchRow"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Płatności" }

interface BankAccount {
  id: string
  name: string
  bank_name: string | null
  account_number: string | null
  currency: string
  current_balance: number | null
  last_synced_at: string | null
  entity_id: string
  entities: { short_name: string; color: string | null } | null
}

export default async function PlatnosciPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const sp = await searchParams

  const { data: accounts } = await supabase
    .schema("ufos")
    .from("bank_accounts")
    .select("id, name, bank_name, account_number, currency, current_balance, last_synced_at, entity_id, entities(short_name, color)")
    .eq("active", true)
    .order("name")

  const accountList = (accounts ?? []) as unknown as BankAccount[]

  // Unmatched inflows (incoming payments needing reconciliation)
  const { data: unmatched } = await supabase
    .schema("ufos")
    .from("bank_transactions")
    .select("id, booking_date, amount, counterparty_name, description, match_status, matched_student_id, matched_note")
    .eq("match_status", "unmatched")
    .gt("amount", 0)
    .order("booking_date", { ascending: false })
    .limit(50)

  // Recently matched
  const { data: matched } = await supabase
    .schema("ufos")
    .from("bank_transactions")
    .select("id, booking_date, amount, counterparty_name, description, match_status, matched_student_id, matched_note")
    .eq("match_status", "matched")
    .order("matched_at", { ascending: false })
    .limit(10)

  // Debtors as match candidates
  const { data: debtorsRaw } = await supabase
    .schema("ufos")
    .from("students_with_debt")
    .select("id, student_name, credit_balance")
    .lt("credit_balance", 0)
    .order("credit_balance", { ascending: true })
    .limit(200)

  const debtors = (debtorsRaw ?? []) as Debtor[]
  const unmatchedTx = (unmatched ?? []) as TxRow[]
  const matchedTx = (matched ?? []) as TxRow[]

  const hasAccounts = accountList.length > 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy-500 rounded-xl flex items-center justify-center">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-500">Płatności</h1>
            <p className="text-sm text-brand-subtle">Wpłaty na kontach i dopasowanie do zaległości</p>
          </div>
        </div>
        {hasAccounts && (
          <div className="flex items-center gap-2">
            <Link href="/platnosci/import" className="btn-secondary text-sm">
              <Upload className="w-4 h-4" /> Importuj wyciąg
            </Link>
            <Link href="/platnosci/konta/nowe" className="btn-secondary text-sm">
              <Plus className="w-4 h-4" /> Konto
            </Link>
          </div>
        )}
      </div>

      {sp.imported && (
        <div className="card border-l-4 border-l-brand-green mb-6 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-green" />
            <p className="text-sm text-navy-500">Zaimportowano {sp.imported} transakcji z wyciągu.</p>
          </div>
        </div>
      )}

      {/* Konta bankowe */}
      {!hasAccounts ? (
        <div className="card text-center py-10">
          <Landmark className="w-10 h-10 text-navy-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-navy-500 mb-1">Brak kont bankowych</p>
          <p className="text-xs text-brand-subtle mb-5 max-w-md mx-auto">
            Dodaj konto bankowe spółki, a następnie importuj wyciąg CSV lub podłącz bank przez Open Banking,
            aby automatycznie sprawdzać czy wpłaty uczniów dotarły.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link href="/platnosci/konta/nowe" className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Dodaj konto
            </Link>
            <Link href="/ustawienia/bank" className="btn-secondary text-sm">
              Open Banking
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {accountList.map((acc) => (
            <div key={acc.id} className="card py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: acc.entities?.color ?? "#1C2B4A" }}
                    />
                    <p className="text-sm font-semibold text-navy-500">{acc.name}</p>
                  </div>
                  <p className="text-xs text-brand-subtle">
                    {acc.entities?.short_name ?? "—"}
                    {acc.bank_name ? ` · ${acc.bank_name}` : ""}
                  </p>
                </div>
                <span className="pill-subtle text-xs">{acc.currency}</span>
              </div>
              <p className="text-xl font-bold text-navy-500 mt-3">
                {acc.current_balance !== null ? formatPLN(acc.current_balance) : "—"}
              </p>
              <p className="text-xs text-brand-subtle mt-0.5">
                {acc.last_synced_at ? `Sync: ${formatDateTime(acc.last_synced_at)}` : "Nie zsynchronizowano"}
              </p>
            </div>
          ))}
        </div>
      )}

      {hasAccounts && (
        <>
          {/* Wpłaty do dopasowania */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownToLine className="w-4 h-4 text-brand-amber" />
              <h2 className="text-sm font-semibold text-navy-500">
                Wpłaty do dopasowania
                {unmatchedTx.length > 0 && (
                  <span className="ml-2 pill-subtle text-xs">{unmatchedTx.length}</span>
                )}
              </h2>
            </div>

            {unmatchedTx.length === 0 ? (
              <div className="card text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-brand-green mx-auto mb-2" />
                <p className="text-sm text-navy-500">Wszystkie wpłaty dopasowane</p>
                <p className="text-xs text-brand-subtle mt-0.5">
                  Zaimportuj nowy wyciąg, aby sprawdzić kolejne wpłaty.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {unmatchedTx.map((tx) => (
                  <MatchRow key={tx.id} tx={tx} debtors={debtors} />
                ))}
              </div>
            )}
          </div>

          {/* Ostatnio dopasowane */}
          {matchedTx.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-navy-500 mb-3">Ostatnio dopasowane</h2>
              <div className="space-y-2">
                {matchedTx.map((tx) => (
                  <MatchRow key={tx.id} tx={tx} debtors={debtors} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Info o bezpieczeństwie */}
      <div className="mt-8 flex items-start gap-2 text-xs text-brand-subtle">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-navy-300" />
        <p>
          Dostęp do banku jest wyłącznie do odczytu. uFOS nie może wykonywać przelewów ani inicjować płatności —
          służy tylko do sprawdzania, czy wpłaty dotarły, i dopasowania ich do zaległości.
        </p>
      </div>
    </div>
  )
}
