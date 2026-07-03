/** Extensible accent target ids — only RP is implemented in v1 */
export type AccentTargetId = 'rp'

export type FeatureStatus = 'locked' | 'in_progress' | 'mastered' | 'needs_review'

export interface RPMinimalPair {
  rp: string
  contrast: string
  rpIpa: string
  contrastIpa: string
  note: string
}

export interface RPExampleWord {
  word: string
  ipa: string
  note?: string
}

export interface RPPracticePhrase {
  id: string
  text: string
  focusWords: string[]
}

export interface RPFeature {
  id: string
  order: number
  title: string
  shortTitle: string
  emoji: string
  rule: string
  articulatoryTips: string[]
  targetIpa: string
  exampleWords: RPExampleWord[]
  minimalPairs: RPMinimalPair[]
  practicePhrases: RPPracticePhrase[]
  badgeId?: string
}

export interface ContrastiveFeedback {
  featureScore: number
  passedFeature: boolean
  summary: string
  whatYouProduced: string
  rpTarget: string
  contrastiveNotes: string[]
  articulatoryCues: string[]
  wordFeedback: Array<{ word: string; issue: string; cue: string }>
  nextDrill: string
}

export interface FeatureMasteryRecord {
  featureId: string
  masteryScore: number
  bestScore: number
  status: FeatureStatus
  attemptCount: number
  lastPracticedAt: Date | null
  nextReviewAt: Date | null
}
