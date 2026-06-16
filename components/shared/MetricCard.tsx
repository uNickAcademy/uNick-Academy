import { cn } from "@/lib/utils/cn"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
  variant?: "default" | "warning" | "danger" | "success"
  className?: string
}

const variantStyles = {
  default: "border-[#E8EBF0]",
  warning: "border-l-4 border-l-brand-amber border-[#E8EBF0]",
  danger:  "border-l-4 border-l-brand-red border-[#E8EBF0]",
  success: "border-l-4 border-l-brand-green border-[#E8EBF0]",
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  return (
    <div className={cn("card", variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-brand-subtle uppercase tracking-wide truncate">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-navy-500 truncate">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-sm text-brand-subtle truncate">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.positive ? "text-brand-green" : "text-brand-red"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className="ml-3 shrink-0 w-10 h-10 bg-brand-muted rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-navy-400" />
          </div>
        )}
      </div>
    </div>
  )
}
