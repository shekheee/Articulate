import { cn } from '@/lib/utils'
import { Flame } from 'lucide-react'

interface StreakBadgeProps {
  current: number
  longest?: number
  className?: string
  showLongest?: boolean
}

export function StreakBadge({ current, longest, className, showLongest }: StreakBadgeProps) {
  const active = current > 0
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors',
        active
          ? 'border-orange-300/60 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-700/50'
          : 'border-border bg-muted/50 text-muted-foreground',
        className
      )}
    >
      <Flame className={cn('h-4 w-4', active && 'text-orange-500 animate-pulse motion-reduce:animate-none')} />
      <span>{current} day{current !== 1 ? 's' : ''}</span>
      {showLongest && longest != null && longest > 0 && (
        <span className="text-xs opacity-70">· best {longest}</span>
      )}
    </div>
  )
}
