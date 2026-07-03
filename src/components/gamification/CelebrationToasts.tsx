'use client'

import { useEffect, useState } from 'react'
import { subscribeGamificationCelebrations } from '@/lib/gamification/celebrate'
import { fireConfetti } from '@/lib/gamification/confetti'
import { getBadge } from '@/lib/gamification/badges'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  title: string
  body?: string
  emoji?: string
}

export function CelebrationToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    return subscribeGamificationCelebrations((payload) => {
      const next: Toast[] = []
      const ts = Date.now()

      if (payload.xpEarned && payload.xpEarned > 0) {
        next.push({
          id: `xp-${ts}`,
          title: `+${payload.xpEarned} XP`,
          body: 'Great practice session!',
          emoji: '✨',
        })
      }

      if (payload.leveledUp && payload.newLevel) {
        next.push({
          id: `level-${ts}`,
          title: `Level ${payload.newLevel}!`,
          body: 'You leveled up — keep going!',
          emoji: '🚀',
        })
        fireConfetti('big')
      }

      if (payload.newBadges?.length) {
        for (const badgeId of payload.newBadges) {
          const badge = getBadge(badgeId)
          next.push({
            id: `badge-${badgeId}-${ts}`,
            title: badge ? `Badge: ${badge.name}` : 'New badge unlocked!',
            body: badge?.description,
            emoji: badge?.icon ?? '🏅',
          })
        }
        if (!payload.leveledUp) fireConfetti('normal')
      }

      if (payload.dailyGoalMet) {
        next.push({
          id: `daily-${ts}`,
          title: 'Daily goal complete!',
          body: 'You hit your practice target for today.',
          emoji: '☀️',
        })
      }

      if (next.length) {
        setToasts((prev) => [...prev, ...next])
        for (const t of next) {
          setTimeout(() => {
            setToasts((prev) => prev.filter((x) => x.id !== t.id))
          }, 4500)
        }
      }
    })
  }, [])

  if (!toasts.length) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[9998] flex flex-col gap-2 max-w-sm pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto animate-in slide-in-from-right fade-in duration-300',
            'rounded-xl border border-primary/20 bg-card/95 backdrop-blur-md shadow-lg px-4 py-3',
            'flex items-start gap-3 motion-reduce:animate-none'
          )}
        >
          {t.emoji && <span className="text-2xl shrink-0">{t.emoji}</span>}
          <div>
            <p className="font-semibold text-sm">{t.title}</p>
            {t.body && <p className="text-xs text-muted-foreground mt-0.5">{t.body}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
