import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {Icon && (
        <div className="w-12 h-12 bg-brand-muted rounded-xl flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-brand-subtle" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-navy-500 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-brand-subtle max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
