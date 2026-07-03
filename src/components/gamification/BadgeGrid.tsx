import { BADGES, getBadge } from '@/lib/gamification/badges'
import { cn } from '@/lib/utils'

interface BadgeGridProps {
  earnedIds: string[]
  className?: string
  compact?: boolean
}

export function BadgeGrid({ earnedIds, className, compact }: BadgeGridProps) {
  const earned = new Set(earnedIds)

  return (
    <div
      className={cn(
        'grid gap-3',
        compact ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3',
        className
      )}
    >
      {BADGES.map((badge) => {
        const unlocked = earned.has(badge.id)
        return (
          <div
            key={badge.id}
            title={badge.description}
            className={cn(
              'rounded-xl border p-3 text-center transition-all hover:scale-[1.02] motion-reduce:hover:scale-100',
              unlocked
                ? 'border-primary/30 bg-primary/5 shadow-sm'
                : 'border-border bg-muted/30 opacity-60 grayscale'
            )}
          >
            <div className={cn('text-2xl mb-1', !unlocked && 'opacity-50')}>{badge.icon}</div>
            <p className="text-xs font-semibold leading-tight">{badge.name}</p>
            {!compact && (
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function BadgeGridSummary({ earnedIds }: { earnedIds: string[] }) {
  const earned = earnedIds.length
  const total = BADGES.length
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{earned}</span> of {total} badges earned
    </p>
  )
}

export { getBadge }
