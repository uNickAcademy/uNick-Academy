import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { importBankCsv } from "../actions"
import { Upload, AlertTriangle } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Importuj wyciąg" }

export default async function ImportWyciaguPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const sp = await searchParams

  const { data: accounts } = await supabase
    .schema("ufos")
    .from("bank_accounts")
    .select("id, name, bank_name, entities(short_name)")
    .eq("active", true)
    .order("name")

  const accountList = (accounts ?? []) as unknown as Array<{
    id: string; name: string; bank_name: string | null; entities: { short_name: string } | null
  }>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Importuj wyciąg bankowy</h1>
        <p className="text-sm text-brand-subtle mt-1">
          Wgraj plik CSV pobrany z bankowości internetowej. uFOS automatycznie rozpozna kolumny.
        </p>
      </div>

      {sp.error === "empty" && (
        <div className="card border-l-4 border-l-brand-red mb-6 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-red" />
            <p className="text-sm text-navy-500">
              Nie rozpoznano żadnych transakcji w pliku. Sprawdź czy to wyciąg CSV z datą i kwotą.
            </p>
          </div>
        </div>
      )}

      {accountList.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-sm text-navy-500 mb-3">Najpierw dodaj konto bankowe.</p>
          <Link href="/ufos/platnosci/konta/nowe" className="btn-primary text-sm">Dodaj konto</Link>
        </div>
      ) : (
        <div className="card">
          <form action={importBankCsv} encType="multipart/form-data" className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">
                Konto <span className="text-brand-red">*</span>
              </label>
              <select
                name="account_id"
                required
                defaultValue={sp.account ?? ""}
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
              >
                <option value="">Wybierz konto</option>
                {accountList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.entities ? ` (${a.entities.short_name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">
                Plik CSV <span className="text-brand-red">*</span>
              </label>
              <input
                name="file"
                type="file"
                accept=".csv,text/csv"
                required
                className="w-full text-sm text-navy-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100 cursor-pointer"
              />
              <p className="text-xs text-brand-subtle mt-1.5">
                Obsługiwane formaty: mBank, PKO BP, ING, Santander, Millennium i inne. Rozpoznawane kolumny:
                data, kwota, nadawca/odbiorca, tytuł.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/ufos/platnosci" className="btn-secondary text-sm">Anuluj</Link>
              <button type="submit" className="btn-primary text-sm">
                <Upload className="w-4 h-4" /> Importuj
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
