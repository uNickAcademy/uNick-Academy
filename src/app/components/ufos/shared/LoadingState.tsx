import { cn } from "@/lib/utils"

interface LoadingStateProps {
  className?: string
  rows?: number
}

export function LoadingState({ className, rows = 3 }: LoadingStateProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-brand-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-brand-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card animate-pulse", className)}>
      <div className="h-3 bg-brand-muted rounded w-1/3 mb-3" />
      <div className="h-7 bg-brand-muted rounded w-1/2 mb-2" />
      <div className="h-3 bg-brand-muted rounded w-2/3" />
    </div>
  )
}
