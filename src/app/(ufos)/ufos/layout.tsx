import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/app/components/ufos/layout/Sidebar"
import { Topbar } from "@/app/components/ufos/layout/Topbar"
import { getHighestRole } from "@/lib/ufos/auth/session"
import type { Entity, UfosUser, UserEntityRole } from "@/types/domain"
import "./ufos.css"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // uFOS jest częścią panelu administracyjnego — dostęp tylko dla adminów
  // (konkretne uprawnienia finansowe nadaje się dalej przez ufos.user_entity_roles)
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/admin/dashboard")

  // Pobierz profil uFOS
  const { data: ufosUser } = await supabase
    .schema("ufos")
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  // Jeśli nie ma profilu – utwórz podstawowy (pierwsze logowanie)
  if (!ufosUser) {
    await supabase.schema("ufos").from("users").insert({
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name ?? user.email ?? "Użytkownik",
    })
  }

  // Pobierz role
  const { data: roles } = await supabase
    .schema("ufos")
    .from("user_entity_roles")
    .select("*")
    .eq("user_id", user.id)

  // Pobierz dostępne podmioty
  const { data: entities } = await supabase
    .schema("ufos")
    .from("entities")
    .select("*")
    .eq("active", true)
    .order("short_name")

  const highestRole = getHighestRole((roles ?? []) as UserEntityRole[])

  return (
    <div className="ufos-scope flex min-h-screen bg-brand-cream">
      <Sidebar role={highestRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          user={(ufosUser ?? { id: user.id, email: user.email ?? "", full_name: "Użytkownik", role_label: null, active: true, created_at: new Date().toISOString() }) as UfosUser}
          entities={(entities ?? []) as Entity[]}
          activeEntityId={entities?.[0]?.id ?? null}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
