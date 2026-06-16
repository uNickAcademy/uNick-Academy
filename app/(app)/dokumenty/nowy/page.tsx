import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { createDocument } from "../actions"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Dodaj dokument" }

export default async function NowyDokumentPage() {
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
        <h1 className="text-2xl font-bold text-navy-500">Dodaj dokument</h1>
        <p className="text-sm text-brand-subtle mt-1">Faktura, umowa, deklaracja lub inny dokument</p>
      </div>

      <div className="card">
        <form action={createDocument} encType="multipart/form-data" className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy-500 mb-1.5">
              Tytuł / opis dokumentu <span className="text-brand-red">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="np. Faktura VAT Cogito maj 2026"
              className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Typ dokumentu</label>
              <select
                name="document_type"
                defaultValue="invoice_in"
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
              >
                <option value="invoice_in">Faktura zakup</option>
                <option value="invoice_out">Faktura sprzedaż</option>
                <option value="contract">Umowa</option>
                <option value="tax_return">Deklaracja podatkowa</option>
                <option value="payroll">Dokument płacowy</option>
                <option value="bank_statement">Wyciąg bankowy</option>
                <option value="other">Inne</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Podmiot</label>
              <select
                name="entity_id"
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
              >
                <option value="">Wybierz podmiot</option>
                {entities?.map((e) => (
                  <option key={e.id} value={e.id}>{e.short_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-500 mb-1.5">Kontrahent</label>
            <input
              name="counterparty"
              type="text"
              placeholder="Nazwa firmy lub osoby"
              className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Kwota (PLN)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Data dokumentu</label>
              <input
                name="document_date"
                type="date"
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-500 mb-1.5">Termin płatności</label>
              <input
                name="due_date"
                type="date"
                className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-500 mb-1.5">
              Plik (PDF, JPG, PNG – max 10 MB)
            </label>
            <input
              name="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.xml"
              className="w-full text-sm text-navy-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100 cursor-pointer"
            />
            <p className="text-xs text-brand-subtle mt-1">
              Plik zostanie zapisany w Supabase Storage (bucket: ufos-documents)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-500 mb-1.5">Notatka</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Dodatkowe uwagi..."
              className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dokumenty" className="btn-secondary text-sm">
              Anuluj
            </Link>
            <button type="submit" className="btn-primary text-sm">
              Zapisz dokument
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
