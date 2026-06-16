import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { createTask } from "../actions"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Nowe zadanie" }

export default async function NoweZadaniePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: entities } = await supabase
    .schema("ufos")
    .from("entities")
    .select("id, short_name")
    .order("short_name")

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Nowe zadanie</h1>
        <p className="text-sm text-brand-subtle mt-1">Utwórz nowe zadanie operacyjne</p>
      </div>

      <div className="card">
        <form action={createTask} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy-500 mb-1.5">
              Tytuł zadania <span className="text-brand-red">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="np. Wysłać JPK_VAT za maj"
              className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Kategoria</label>
              <select
                name="category"
                defaultValue="other"
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
              >
                <option value="tax">Podatki</option>
                <option value="payroll">Płace</option>
                <option value="accounting">Księgowość</option>
                <option value="legal">Prawne</option>
                <option value="operational">Operacyjne</option>
                <option value="other">Inne</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Priorytet</label>
              <select
                name="priority"
                defaultValue="medium"
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
              >
                <option value="low">Niski</option>
                <option value="medium">Normalny</option>
                <option value="high">Wysoki</option>
                <option value="urgent">Pilny</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Termin</label>
              <input
                name="due_date"
                type="date"
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Podmiot</label>
              <select
                name="entity_id"
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
              >
                <option value="">Wszystkie podmioty</option>
                {entities?.map((e) => (
                  <option key={e.id} value={e.id}>{e.short_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-500 mb-1.5">Opis (opcjonalnie)</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Dodatkowe informacje, linki, instrukcje..."
              className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/zadania" className="btn-secondary text-sm">
              Anuluj
            </Link>
            <button type="submit" className="btn-primary text-sm">
              Utwórz zadanie
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
