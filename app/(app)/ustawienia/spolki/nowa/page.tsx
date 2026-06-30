import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isGusConfigured } from "@/lib/gus/client"
import { AddEntityForm } from "./AddEntityForm"
import { AlertTriangle } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dodaj spółkę" }

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Nazwa i nazwa skrócona są wymagane.",
  duplicate: "Spółka z tym NIP-em już istnieje w systemie.",
  save: "Nie udało się zapisać spółki. Spróbuj ponownie.",
}

export default async function NowaSpolkaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const sp = await searchParams
  const gusConfigured = isGusConfigured()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Dodaj spółkę</h1>
        <p className="text-sm text-brand-subtle mt-1">
          Wpisz NIP, a dane (nazwa, REGON, adres) pobierzemy automatycznie z rejestru GUS.
        </p>
      </div>

      {sp.error && ERROR_MESSAGES[sp.error] && (
        <div className="card border-l-4 border-l-brand-red mb-6 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-red" />
            <p className="text-sm text-navy-500">{ERROR_MESSAGES[sp.error]}</p>
          </div>
        </div>
      )}

      <div className="card">
        <AddEntityForm gusConfigured={gusConfigured} />
      </div>
    </div>
  )
}
