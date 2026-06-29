import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Landmark, ShieldCheck, ExternalLink, RefreshCw } from "lucide-react"
import { formatDateTime } from "@/lib/utils/formatters"
import { isGoCardlessConfigured } from "@/lib/banking/gocardless"
import { ConnectBankButton } from "./ConnectBankButton"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Open Banking" }

export default async function BankSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const configured = isGoCardlessConfigured()

  const { data: entities } = await supabase
    .schema("ufos")
    .from("entities")
    .select("id, short_name, name")
    .order("short_name")

  const { data: accounts } = await supabase
    .schema("ufos")
    .from("bank_accounts")
    .select("id, name, bank_name, provider, last_synced_at, entities(short_name)")
    .order("name")

  const accountList = (accounts ?? []) as unknown as Array<{
    id: string; name: string; bank_name: string | null; provider: string | null
    last_synced_at: string | null; entities: { short_name: string } | null
  }>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy-500 rounded-xl flex items-center justify-center">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-500">Open Banking</h1>
            <p className="text-sm text-brand-subtle">Automatyczne pobieranie transakcji (PSD2, tylko odczyt)</p>
          </div>
        </div>
      </div>

      {/* Bezpieczeństwo */}
      <div className="card border-l-4 border-l-brand-green mb-6 py-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-navy-500">Dostęp wyłącznie do odczytu</p>
            <p className="text-xs text-brand-subtle mt-0.5">
              Autoryzacja odbywa się bezpośrednio w banku. uFOS nie zna Twojego hasła i nie może wykonywać przelewów —
              widzi tylko historię i saldo. Zgoda wygasa po 90 dniach.
            </p>
          </div>
        </div>
      </div>

      {!configured ? (
        <div className="card border border-dashed border-brand-amber py-5">
          <p className="text-sm font-medium text-navy-500 mb-2">Integracja nie jest jeszcze skonfigurowana</p>
          <p className="text-xs text-brand-subtle mb-4">
            Aby podłączyć bank, potrzebne jest darmowe konto GoCardless Bank Account Data. Kroki:
          </p>
          <ol className="text-xs text-brand-subtle space-y-1.5 list-decimal list-inside mb-4">
            <li>
              Załóż konto na{" "}
              <a href="https://bankaccountdata.gocardless.com/" target="_blank" rel="noopener noreferrer"
                 className="text-navy-500 underline inline-flex items-center gap-0.5">
                bankaccountdata.gocardless.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>W portalu wygeneruj <code className="bg-brand-muted px-1 rounded">secret_id</code> oraz <code className="bg-brand-muted px-1 rounded">secret_key</code></li>
            <li>Dodaj je do zmiennych środowiskowych w Vercel:
              <code className="bg-brand-muted px-1 rounded mx-1">GOCARDLESS_SECRET_ID</code>,
              <code className="bg-brand-muted px-1 rounded">GOCARDLESS_SECRET_KEY</code></li>
            <li>Wróć tutaj — pojawi się przycisk „Podłącz bank”.</li>
          </ol>
          <p className="text-xs text-brand-subtle">
            W międzyczasie możesz korzystać z <Link href="/platnosci/import" className="text-navy-500 underline">importu wyciągu CSV</Link>.
          </p>
        </div>
      ) : (
        <div className="card py-5">
          <p className="text-sm font-medium text-navy-500 mb-1">Podłącz konto bankowe</p>
          <p className="text-xs text-brand-subtle mb-4">
            Wybierz spółkę i bank. Zostaniesz przekierowany do banku, aby autoryzować dostęp do odczytu.
          </p>
          <ConnectBankButton entities={entities ?? []} />
        </div>
      )}

      {/* Podłączone konta */}
      {accountList.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-navy-500 mb-3">Konta w systemie</h2>
          <div className="space-y-2">
            {accountList.map((a) => (
              <div key={a.id} className="card flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-navy-500">{a.name}</p>
                  <p className="text-xs text-brand-subtle">
                    {a.entities?.short_name ?? "—"}
                    {a.bank_name ? ` · ${a.bank_name}` : ""}
                    {" · "}
                    {a.provider === "gocardless" ? "Open Banking" : a.provider === "csv" ? "Import CSV" : "Ręczne"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-brand-subtle">
                  <RefreshCw className="w-3 h-3" />
                  {a.last_synced_at ? formatDateTime(a.last_synced_at) : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
