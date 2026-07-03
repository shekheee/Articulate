import type { FeatureStatus, FeatureMasteryRecord } from './types'
import { RP_CURRICULUM, getRPFeature } from './curriculum'

export const MASTERY_PASS_SCORE = 80
export const MASTERY_UNLOCK_PREV = 70
export const REVIEW_INTERVALS_DAYS = [3, 7, 14, 30]

export function emptyMastery(featureId: string, status: FeatureStatus = 'locked'): FeatureMasteryRecord {
  return {
    featureId,
    masteryScore: 0,
    bestScore: 0,
    status,
    attemptCount: 0,
    lastPracticedAt: null,
    nextReviewAt: null,
  }
}

/** Merge DB rows with curriculum defaults */
export function buildMasteryMap(
  rows: FeatureMasteryRecord[]
): Map<string, FeatureMasteryRecord> {
  const map = new Map<string, FeatureMasteryRecord>()
  for (const f of RP_CURRICULUM) {
    const existing = rows.find((r) => r.featureId === f.id)
    if (existing) {
      map.set(f.id, existing)
    } else {
      map.set(f.id, emptyMastery(f.id, f.order === 1 ? 'in_progress' : 'locked'))
    }
  }
  return map
}

export function resolveFeatureStatuses(map: Map<string, FeatureMasteryRecord>): Map<string, FeatureMasteryRecord> {
  const sorted = [...RP_CURRICULUM].sort((a, b) => a.order - b.order)
  const now = new Date()

  for (let i = 0; i < sorted.length; i++) {
    const feature = sorted[i]
    const rec = map.get(feature.id)!
    const prev = i > 0 ? map.get(sorted[i - 1].id)! : null

    if (rec.status === 'mastered' && rec.nextReviewAt && rec.nextReviewAt <= now) {
      rec.status = 'needs_review'
    }

    if (rec.status === 'locked') {
      if (feature.order === 1) {
        rec.status = 'in_progress'
      } else if (prev && (prev.status === 'mastered' || prev.masteryScore >= MASTERY_UNLOCK_PREV)) {
        rec.status = 'in_progress'
      }
    }

    map.set(feature.id, rec)
  }
  return map
}

export function updateMasteryAfterAttempt(
  current: FeatureMasteryRecord,
  featureScore: number
): FeatureMasteryRecord {
  const attemptCount = current.attemptCount + 1
  const bestScore = Math.max(current.bestScore, featureScore)
  const masteryScore = Math.round(current.masteryScore * 0.4 + featureScore * 0.6)
  let status: FeatureStatus = current.status === 'locked' ? 'in_progress' : current.status

  if (featureScore >= MASTERY_PASS_SCORE && attemptCount >= 2) {
    status = 'mastered'
  } else if (status === 'needs_review' && featureScore >= MASTERY_PASS_SCORE - 5) {
    status = 'mastered'
  } else if (status !== 'mastered') {
    status = 'in_progress'
  }

  const now = new Date()
  let nextReviewAt: Date | null = current.nextReviewAt
  if (status === 'mastered') {
    const tier = Math.min(attemptCount - 1, REVIEW_INTERVALS_DAYS.length - 1)
    const days = REVIEW_INTERVALS_DAYS[Math.max(0, tier)]
    nextReviewAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  }

  return {
    featureId: current.featureId,
    masteryScore,
    bestScore,
    status,
    attemptCount,
    lastPracticedAt: now,
    nextReviewAt,
  }
}

export interface NextPracticeSuggestion {
  featureId: string
  phraseId: string
  reason: string
}

export function suggestNextPractice(map: Map<string, FeatureMasteryRecord>): NextPracticeSuggestion | null {
  const sorted = [...RP_CURRICULUM].sort((a, b) => a.order - b.order)

  for (const f of sorted) {
    const rec = map.get(f.id)
    if (!rec) continue
    if (rec.status === 'needs_review' || rec.status === 'in_progress') {
      const phrase = f.practicePhrases[rec.attemptCount % f.practicePhrases.length]
      return {
        featureId: f.id,
        phraseId: phrase.id,
        reason:
          rec.status === 'needs_review'
            ? 'Time to review this feature'
            : 'Continue your current unit',
      }
    }
  }

  for (const f of sorted) {
    const rec = map.get(f.id)
    if (rec?.status === 'locked') {
      const phrase = f.practicePhrases[0]
      return { featureId: f.id, phraseId: phrase.id, reason: 'Unlock this next feature' }
    }
  }

  const last = sorted[sorted.length - 1]
  return {
    featureId: last.id,
    phraseId: last.practicePhrases[0].id,
    reason: 'Keep your RP sharp with review',
  }
}

export function countMasteredFeatures(map: Map<string, FeatureMasteryRecord>): number {
  return [...map.values()].filter((r) => r.status === 'mastered').length
}

export function getFeatureProgressLabel(status: FeatureStatus): string {
  switch (status) {
    case 'locked':
      return 'Locked'
    case 'in_progress':
      return 'In progress'
    case 'mastered':
      return 'Mastered'
    case 'needs_review':
      return 'Review due'
  }
}

export { getRPFeature }
