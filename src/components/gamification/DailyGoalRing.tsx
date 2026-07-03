import { cn } from '@/lib/utils'

interface DailyGoalRingProps {
  current: number
  goal: number
  pct: number
  size?: number
  className?: string
}

export function DailyGoalRing({ current, goal, pct, size = 72, className }: DailyGoalRingProps) {
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const complete = current >= goal

  return (
    <div className={cn('relative inline-flex flex-col items-center gap-1', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            'transition-all duration-700 ease-out motion-reduce:transition-none',
            complete ? 'text-emerald-500' : 'text-primary'
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-bold tabular-nums leading-none">
          {current}/{goal}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">today</span>
      </div>
    </div>
  )
}
