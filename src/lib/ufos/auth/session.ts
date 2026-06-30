import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { UfosUser, UserEntityRole, UserRole } from "@/types/domain"

export interface SessionData {
  user: UfosUser
  roles: UserEntityRole[]
  activeEntityId: string | null
}

export async function getSession(): Promise<SessionData | null> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: ufosUser } = await supabase
    .schema("ufos")
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!ufosUser) return null

  const { data: roles } = await supabase
    .schema("ufos")
    .from("user_entity_roles")
    .select("*")
    .eq("user_id", user.id)

  return {
    user: ufosUser as UfosUser,
    roles: (roles ?? []) as UserEntityRole[],
    activeEntityId: null,
  }
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

export function hasRole(roles: UserEntityRole[], role: UserRole, entityId?: string): boolean {
  return roles.some((r) => {
    if (r.role !== role) return false
    if (r.entity_id === null) return true // globalny dostęp
    if (entityId && r.entity_id === entityId) return true
    return false
  })
}

export function getHighestRole(roles: UserEntityRole[], entityId?: string): UserRole | null {
  const priority: UserRole[] = [
    'owner_cfo', 'accounting_ops', 'payroll_operator',
    'external_accountant', 'tax_advisor', 'read_only'
  ]

  const userRoles = roles
    .filter((r) => r.entity_id === null || r.entity_id === entityId)
    .map((r) => r.role)

  for (const role of priority) {
    if (userRoles.includes(role)) return role
  }

  return null
}
