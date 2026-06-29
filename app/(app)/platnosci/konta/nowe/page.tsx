import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { addBankAccount } from "../../actions"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Dodaj konto bankowe" }

export default async function NoweKontoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: entities } = await supabase
    .schema("ufos")
    .from("entities")
    .select("id, short_name, name")
    .order("short_name")

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Dodaj konto bankowe</h1>
        <p className="text-sm text-brand-subtle mt-1">
          Konto spółki do śledzenia wpłat. Wyciągi importujesz potem przez CSV.
        </p>
      </div>

      <div className="card">
        <form action={addBankAccount} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy-500 mb-1.5">
              Nazwa konta <span className="text-brand-red">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="np. Konto główne UA"
              className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-500 mb-1.5">
              Spółka <span className="text-brand-red">*</span>
            </label>
            <select
              name="entity_id"
              required
              className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
            >
              <option value="">Wybierz spółkę</option>
              {entities?.map((e) => (
                <option key={e.id} value={e.id}>{e.short_name} — {e.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Bank</label>
              <input
                name="bank_name"
                type="text"
                placeholder="np. mBank, PKO BP"
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Numer konta</label>
              <input
                name="account_number"
                type="text"
                placeholder="ostatnie 4 cyfry wystarczą"
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-500 mb-1.5">IBAN (opcjonalnie)</label>
            <input
              name="iban"
              type="text"
              placeholder="PL00 0000 0000 0000 0000 0000 0000"
              className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/platnosci" className="btn-secondary text-sm">Anuluj</Link>
            <button type="submit" className="btn-primary text-sm">Zapisz konto</button>
          </div>
        </form>
      </div>
    </div>
  )
}
