import { XPBar } from './XPBar'
import { StreakBadge } from './StreakBadge'
import { DailyGoalRing } from './DailyGoalRing'
import type { GamificationProfile } from '@/lib/gamification/award'
import { cn } from '@/lib/utils'

interface GamificationHeroProps {
  profile: GamificationProfile
  className?: string
}

export function GamificationHero({ profile, className }: GamificationHeroProps) {
  const streakNudge =
    profile.currentStreak > 0 &&
    profile.dailySessions < profile.dailyGoal

  return (
    <div
      className={cn(
        'rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-cyan-500/5 p-5 shadow-sm',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <DailyGoalRing
          current={profile.dailySessions}
          goal={profile.dailyGoal}
          pct={profile.dailyProgressPct}
        />
        <div className="flex-1 w-full space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StreakBadge current={profile.currentStreak} longest={profile.longestStreak} showLongest />
            <span className="text-xs text-muted-foreground tabular-nums">{profile.xp.toLocaleString()} XP total</span>
          </div>
          <XPBar
            level={profile.level}
            xpInLevel={profile.xpInLevel}
            xpToNextLevel={profile.xpToNextLevel}
            pct={profile.xpLevelPct}
          />
          {streakNudge && (
            <p className="text-xs text-orange-600 dark:text-orange-400 animate-pulse motion-reduce:animate-none">
              🔥 Keep your {profile.currentStreak}-day streak — complete {profile.dailyGoal - profile.dailySessions} more session
              {profile.dailyGoal - profile.dailySessions !== 1 ? 's' : ''} today!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
