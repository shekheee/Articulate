import { auth } from '@/lib/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/PageShell'
import { getGamificationProfile } from '@/lib/gamification/award'
import { getUserFeatureMastery } from '@/lib/db/queries'
import { GamificationHero } from '@/components/gamification/GamificationHero'
import { ButtonLink } from '@/components/ui/button-link'
import {
  ACCENT_TARGET,
  RP_CURRICULUM,
  buildMasteryMap,
  resolveFeatureStatuses,
  suggestNextPractice,
  countMasteredFeatures,
  getFeatureProgressLabel,
} from '@/lib/accent/rp'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Lock, CheckCircle2, Circle, RotateCcw } from 'lucide-react'
import Link from 'next/link'
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

export default async function AccentPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [gamification, dbRows] = await Promise.all([
    getGamificationProfile(session.user.id),
    getUserFeatureMastery(session.user.id),
  ])

  const map = resolveFeatureStatuses(buildMasteryMap(dbRows.map(rowToRecord)))
  const mastered = countMasteredFeatures(map)
  const suggestion = suggestNextPractice(map)

  return (
    <PageShell maxWidth="md">
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{ACCENT_TARGET.flag}</span>
            <h1 className="text-3xl font-bold tracking-tight">RP Accent Trainer</h1>
          </div>
          <p className="text-muted-foreground mt-1 max-w-xl">
            {ACCENT_TARGET.description} Work through feature units — listen, shadow, get contrastive feedback, and track mastery.
          </p>
        </div>

        <GamificationHero profile={gamification} />

        <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold">Training path progress</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mastered} of {RP_CURRICULUM.length} features mastered
            </p>
            <Progress value={(mastered / RP_CURRICULUM.length) * 100} className="h-2 mt-2" />
          </div>
          {suggestion && (
            <ButtonLink href={`/accent/learn/${suggestion.featureId}`} size="lg" className="shrink-0">
              ▶ {suggestion.reason}
            </ButtonLink>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Feature curriculum</h2>
          {RP_CURRICULUM.map((feature) => {
            const m = map.get(feature.id)!
            const locked = m.status === 'locked'
            const Icon =
              m.status === 'mastered'
                ? CheckCircle2
                : m.status === 'needs_review'
                  ? RotateCcw
                  : locked
                    ? Lock
                    : Circle

            const content = (
              <div
                className={`interactive-card p-4 flex items-start gap-4 ${locked ? 'opacity-60 pointer-events-none' : ''} ${m.status === 'in_progress' || m.status === 'needs_review' ? 'ring-2 ring-primary/25 border-primary/30' : ''}`}
              >
                <div className="flex flex-col items-center gap-1 shrink-0 w-10">
                  <span className="text-2xl">{feature.emoji}</span>
                  <span className="text-xs text-muted-foreground">{feature.order}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{feature.shortTitle}</p>
                    <Badge variant="outline" className="text-xs">
                      {getFeatureProgressLabel(m.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{feature.rule}</p>
                  {m.attemptCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Mastery {m.masteryScore}% · best {m.bestScore}% · {m.attemptCount} attempts
                    </p>
                  )}
                </div>
                <Icon
                  className={`h-5 w-5 shrink-0 ${m.status === 'mastered' ? 'text-emerald-600' : m.status === 'needs_review' ? 'text-amber-600' : 'text-muted-foreground'}`}
                />
              </div>
            )

            return locked ? (
              <div key={feature.id}>{content}</div>
            ) : (
              <Link key={feature.id} href={`/accent/learn/${feature.id}`} className="block">
                {content}
              </Link>
            )
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <ButtonLink href="/accent/coach" variant="outline" className="h-auto py-4 flex-col gap-1">
            <span className="text-lg">💬 RP Conversation Coach</span>
            <span className="text-xs text-muted-foreground font-normal">Live practice + session summary</span>
          </ButtonLink>
          <ButtonLink href="/accent/progress" variant="outline" className="h-auto py-4 flex-col gap-1">
            <span className="text-lg">📈 Progress & badges</span>
            <span className="text-xs text-muted-foreground font-normal">Mastery stats and achievements</span>
          </ButtonLink>
        </div>
      </div>
    </PageShell>
  )
}
