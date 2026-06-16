import { cn } from "@/lib/utils/cn"

interface EntityBadgeProps {
  shortName: string
  color?: string
  className?: string
}

export function EntityBadge({ shortName, color = "#1C2B4A", className }: EntityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
        className
      )}
      style={{
        backgroundColor: color + "18",
        color: color,
      }}
    >
      {shortName}
    </span>
  )
}
