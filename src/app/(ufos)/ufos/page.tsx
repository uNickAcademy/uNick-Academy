import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getHighestRole } from "@/lib/ufos/auth/session"
import type { UserEntityRole } from "@/types/domain"

export default async function UfosIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: roles } = await supabase
    .schema("ufos")
    .from("user_entity_roles")
    .select("*")
    .eq("user_id", user.id)

  const role = getHighestRole((roles ?? []) as UserEntityRole[])

  redirect(role === "owner_cfo" ? "/ufos/dashboard/cfo" : "/ufos/dashboard/ops")
}
