import { getInitials } from "@/lib/utils/formatters"
import type { UfosUser } from "@/types/domain"
import { EntitySwitcher } from "./EntitySwitcher"
import type { Entity } from "@/types/domain"

interface TopbarProps {
  user: UfosUser
  entities: Entity[]
  activeEntityId: string | null
}

export function Topbar({ user, entities, activeEntityId }: TopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-[#E8EBF0] flex items-center justify-between px-6">
      <EntitySwitcher entities={entities} activeEntityId={activeEntityId} />

      <div className="flex items-center gap-3">
        <span className="text-sm text-brand-subtle">{user.full_name}</span>
        <div className="w-8 h-8 rounded-full bg-navy-500 flex items-center justify-center">
          <span className="text-white text-xs font-semibold">
            {getInitials(user.full_name)}
          </span>
        </div>
      </div>
    </header>
  )
}
