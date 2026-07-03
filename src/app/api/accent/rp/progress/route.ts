import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { getUserFeatureMastery } from '@/lib/db/queries'
import {
  RP_CURRICULUM,
  ACCENT_TARGET,
  buildMasteryMap,
  resolveFeatureStatuses,
  suggestNextPractice,
  countMasteredFeatures,
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

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbRows = await getUserFeatureMastery(session.user.id)
  const map = resolveFeatureStatuses(buildMasteryMap(dbRows.map(rowToRecord)))
  const features = RP_CURRICULUM.map((f) => {
    const m = map.get(f.id)!
    return {
      ...f,
      mastery: m,
    }
  })
  const suggestion = suggestNextPractice(map)

  return NextResponse.json({
    accentTarget: ACCENT_TARGET,
    features,
    masteredCount: countMasteredFeatures(map),
    totalFeatures: RP_CURRICULUM.length,
    suggestion,
  })
}
