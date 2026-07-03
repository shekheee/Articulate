import { cn } from '@/lib/utils'

interface XPBarProps {
  level: number
  xpInLevel: number
  xpToNextLevel: number
  pct: number
  className?: string
  compact?: boolean
}

export function XPBar({ level, xpInLevel, xpToNextLevel, pct, className, compact }: XPBarProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold flex items-center gap-1.5">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {level}
          </span>
          {!compact && <span className="text-muted-foreground">Level {level}</span>}
        </span>
        {!compact && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {xpInLevel} / {xpToNextLevel} XP
          </span>
        )}
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-primary to-cyan-400 transition-all duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level ${level} progress`}
        />
      </div>
    </div>
  )
}
