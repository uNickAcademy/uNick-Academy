import { cn } from "@/lib/utils/cn"

type Variant = "green" | "amber" | "red" | "subtle" | "navy"

interface StatusPillProps {
  label: string
  variant: Variant
  className?: string
}

const variantClasses: Record<Variant, string> = {
  green:  "pill-green",
  amber:  "pill-amber",
  red:    "pill-red",
  subtle: "pill-subtle",
  navy:   "pill-navy",
}

export function StatusPill({ label, variant, className }: StatusPillProps) {
  return (
    <span className={cn(variantClasses[variant], className)}>
      {label}
    </span>
  )
}
