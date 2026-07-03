import { auth } from '@/lib/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/PageShell'
import { FeatureTrainer } from '@/components/accent/FeatureTrainer'
import { ButtonLink } from '@/components/ui/button-link'
import { getUserFeatureMastery } from '@/lib/db/queries'
import {
  getRPFeature,
  buildMasteryMap,
  resolveFeatureStatuses,
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

export default async function LearnFeaturePage({
  params,
}: {
  params: Promise<{ featureId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { featureId } = await params
  const feature = getRPFeature(featureId)
  if (!feature) notFound()

  const dbRows = await getUserFeatureMastery(session.user.id)
  const map = resolveFeatureStatuses(buildMasteryMap(dbRows.map(rowToRecord)))
  const mastery = map.get(featureId)!

  return (
    <PageShell maxWidth="md">
      <div className="space-y-4">
        <ButtonLink href="/accent" variant="ghost" size="sm">
          ← Training path
        </ButtonLink>
        <FeatureTrainer
          feature={feature}
          status={mastery.status}
          masteryScore={mastery.masteryScore}
          bestScore={mastery.bestScore}
        />
      </div>
    </PageShell>
  )
}
