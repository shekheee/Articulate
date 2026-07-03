export interface GamificationCelebrationPayload {
  xpEarned?: number
  leveledUp?: boolean
  newLevel?: number
  newBadges?: string[]
  dailyGoalMet?: boolean
}

const EVENT = 'articulate:gamification'

export function showGamificationCelebrations(payload: GamificationCelebrationPayload) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT, { detail: payload }))
}

export function subscribeGamificationCelebrations(
  handler: (payload: GamificationCelebrationPayload) => void
): () => void {
  const listener = (e: Event) => {
    handler((e as CustomEvent<GamificationCelebrationPayload>).detail)
  }
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
