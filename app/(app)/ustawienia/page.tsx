import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Settings, Plug, Building2, Users, Shield } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Ustawienia" }

export default async function UstawieniaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: entities } = await supabase
    .schema("ufos")
    .from("entities")
    .select("id, short_name, full_name, tax_id, entity_type")
    .order("short_name")

  const { data: ufosUsers } = await supabase
    .schema("ufos")
    .from("users")
    .select("id, full_name, email, role")
    .order("full_name")

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy-500 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-500">Ustawienia</h1>
            <p className="text-sm text-brand-subtle">Konfiguracja systemu uFOS</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Integracje */}
        <a href="/ustawienia/integracje" className="card flex items-center justify-between py-4 hover:bg-brand-muted/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-muted flex items-center justify-center">
              <Plug className="w-4 h-4 text-navy-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-500">Integracje</p>
              <p className="text-xs text-brand-subtle">Źródła danych, mapowanie pól, konfiguracja API</p>
            </div>
          </div>
          <span className="text-xs text-brand-subtle">→</span>
        </a>

        {/* Spółki */}
        <div className="card py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-brand-muted flex items-center justify-center">
              <Building2 className="w-4 h-4 text-navy-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-500">Spółki</p>
              <p className="text-xs text-brand-subtle">Podmioty prawne w systemie</p>
            </div>
          </div>
          <div className="space-y-2">
            {(entities ?? []).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-brand-muted/40">
                <div>
                  <p className="text-sm font-medium text-navy-500">{e.short_name}</p>
                  <p className="text-xs text-brand-subtle">{e.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-subtle">NIP: {e.tax_id ?? "—"}</p>
                  <p className="text-xs text-brand-subtle capitalize">{e.entity_type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Użytkownicy */}
        <div className="card py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-brand-muted flex items-center justify-center">
              <Users className="w-4 h-4 text-navy-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-500">Użytkownicy uFOS</p>
              <p className="text-xs text-brand-subtle">Osoby z dostępem do systemu</p>
            </div>
          </div>
          <div className="space-y-2">
            {(ufosUsers ?? []).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-brand-muted/40">
                <div>
                  <p className="text-sm font-medium text-navy-500">{u.full_name}</p>
                  <p className="text-xs text-brand-subtle">{u.email}</p>
                </div>
                <span className="pill-subtle text-xs">{u.role}</span>
              </div>
            ))}
            {(!ufosUsers || ufosUsers.length === 0) && (
              <p className="text-xs text-brand-subtle text-center py-2">Brak użytkowników</p>
            )}
          </div>
        </div>

        {/* Bezpieczeństwo */}
        <div className="card py-4 bg-brand-muted">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
              <Shield className="w-4 h-4 text-navy-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-500">Bezpieczeństwo</p>
              <p className="text-xs text-brand-subtle">
                RLS aktywne · Audit log włączony · Zarządzanie rolami i uprawnieniami — w przygotowaniu
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
