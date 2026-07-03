import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import { getGamificationProfile } from '@/lib/gamification/award'
import { getUserFeatureMastery } from '@/lib/db/queries'
import { PageShell } from '@/components/layout/PageShell'
import { GamificationHero } from '@/components/gamification/GamificationHero'
import { BadgeGrid, BadgeGridSummary } from '@/components/gamification/BadgeGrid'
import { ButtonLink } from '@/components/ui/button-link'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  RP_CURRICULUM,
  buildMasteryMap,
  resolveFeatureStatuses,
  countMasteredFeatures,
  getFeatureProgressLabel,
  suggestNextPractice,
} from '@/lib/accent/rp'
import type { FeatureMasteryRecord } from '@/lib/accent/rp/types'

function rowToRecord(row: {
  featureId: string
  masteryScore: number
  bestScore: number
  status: string
  attemptCount: number
  lastPracticedAt: Date | null
  nextReviewAt: Date | null
}): FeatureMasteryRecord {
  return {
    featureId: row.featureId,
    masteryScore: row.masteryScore,
    bestScore: row.bestScore,
    status: row.status as FeatureMasteryRecord['status'],
    attemptCount: row.attemptCount,
    lastPracticedAt: row.lastPracticedAt,
    nextReviewAt: row.nextReviewAt,
  }
}

export default async function ProgressPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [gamification, dbRows] = await Promise.all([
    getGamificationProfile(session.user.id),
    getUserFeatureMastery(session.user.id),
  ])

  const map = resolveFeatureStatuses(buildMasteryMap(dbRows.map(rowToRecord)))
  const mastered = countMasteredFeatures(map)
  const suggestion = suggestNextPractice(map)
  const totalAttempts = [...map.values()].reduce((s, r) => s + r.attemptCount, 0)

  return (
    <PageShell maxWidth="md">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RP Progress</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Per-feature mastery, spaced review, and RP badges.
          </p>
        </div>

        <GamificationHero profile={gamification} />

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Mastered', value: `${mastered}/${RP_CURRICULUM.length}` },
            { label: 'Attempts', value: totalAttempts },
            { label: 'RP badges', value: gamification.earnedBadges.filter((b) => b.startsWith('rp_')).length },
          ].map((s) => (
            <div key={s.label} className="glass-card p-3 text-center">
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {suggestion && totalAttempts > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm">
              <strong>Suggested next:</strong> {suggestion.reason}
            </p>
            <ButtonLink href={`/accent/learn/${suggestion.featureId}`} size="sm">
              Practise now
            </ButtonLink>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Feature mastery</h2>
          {RP_CURRICULUM.map((f) => {
            const m = map.get(f.id)!
            return (
              <div key={f.id} className="glass-card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span>{f.emoji}</span>
                    <span className="font-medium text-sm">{f.shortTitle}</span>
                  </div>
                  <Badge variant={m.status === 'mastered' ? 'default' : 'outline'} className="text-xs">
                    {getFeatureProgressLabel(m.status)}
                  </Badge>
                </div>
                <Progress value={m.masteryScore} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  {m.attemptCount} attempts · best {m.bestScore}%
                  {m.nextReviewAt && m.status === 'mastered'
                    ? ` · review ${m.nextReviewAt.toLocaleDateString()}`
                    : ''}
                </p>
              </div>
            )
          })}
        </div>

        {totalAttempts === 0 ? (
          <div className="glass-card border-dashed p-10 text-center">
            <p className="text-4xl mb-3">🇬🇧</p>
            <p className="text-muted-foreground mb-4">Start with Unit 1 — Non-rhotic R</p>
            <ButtonLink href="/accent/learn/non_rhotic_r">Begin RP training</ButtonLink>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Achievements</h2>
            <BadgeGridSummary earnedIds={gamification.earnedBadges} />
          </div>
          <BadgeGrid earnedIds={gamification.earnedBadges} compact />
        </div>
      </div>
    </PageShell>
  )
}
