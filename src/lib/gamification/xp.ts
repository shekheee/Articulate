/** XP thresholds: level N requires cumulative XP >= LEVEL_XP[N-1] */
export const LEVEL_XP = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000]

export const DAILY_GOAL_SESSIONS = 2

export const XP_REWARDS = {
  accent_shadowing: (accuracy: number) => 20 + Math.round(accuracy / 5),
  accent_drill: (accuracy: number) => 15 + Math.round(accuracy / 5),
  accent_coach: () => 45,
  rp_feature: (accuracy: number) => 25 + Math.round(accuracy / 4),
  interview: (score: number) => 50 + score * 10,
} as const

export function levelFromXp(xp: number): number {
  let level = 1
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) {
      level = i + 1
      break
    }
  }
  return level
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; pct: number } {
  const level = levelFromXp(xp)
  const floor = LEVEL_XP[level - 1] ?? 0
  const ceiling = LEVEL_XP[level] ?? floor + 1000
  const current = xp - floor
  const needed = ceiling - floor
  return { current, needed, pct: Math.min(100, Math.round((current / needed) * 100)) }
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export function yesterdayUtc(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}
