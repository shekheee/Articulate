import { db } from '@/lib/db'
import { users, accentAttempts, interviewSessions, accentFeatureMastery } from '@/lib/db/schema'
import { eq, count, and } from 'drizzle-orm'
import {
  levelFromXp,
  xpProgressInLevel,
  todayUtc,
  yesterdayUtc,
  DAILY_GOAL_SESSIONS,
  XP_REWARDS,
} from './xp'
import { BADGES } from './badges'

export interface GamificationProfile {
  xp: number
  level: number
  currentStreak: number
  longestStreak: number
  dailySessions: number
  dailyGoal: number
  dailyProgressPct: number
  xpInLevel: number
  xpToNextLevel: number
  xpLevelPct: number
  earnedBadges: string[]
  badges: typeof BADGES
}

export interface GamificationAward {
  xpEarned: number
  leveledUp: boolean
  newLevel: number
  newBadges: string[]
  currentStreak: number
  dailySessions: number
  dailyGoalMet: boolean
}

async function countAccentAttempts(userId: string): Promise<number> {
  const [row] = await db.select({ c: count() }).from(accentAttempts).where(eq(accentAttempts.userId, userId))
  return Number(row?.c ?? 0)
}

async function countCompletedInterviews(userId: string): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(interviewSessions)
    .where(and(eq(interviewSessions.userId, userId), eq(interviewSessions.status, 'completed')))
  return Number(row?.c ?? 0)
}

export async function getGamificationProfile(userId: string): Promise<GamificationProfile> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw new Error('User not found')

  const xp = user.xp ?? 0
  const level = user.level ?? levelFromXp(xp)
  const dailyGoal = user.dailyGoal ?? DAILY_GOAL_SESSIONS
  const today = todayUtc()
  const dailySessions = user.dailySessionsDate === today ? (user.dailySessions ?? 0) : 0
  const prog = xpProgressInLevel(xp)

  return {
    xp,
    level,
    currentStreak: user.currentStreak ?? 0,
    longestStreak: user.longestStreak ?? 0,
    dailySessions,
    dailyGoal,
    dailyProgressPct: Math.min(100, Math.round((dailySessions / dailyGoal) * 100)),
    xpInLevel: prog.current,
    xpToNextLevel: prog.needed,
    xpLevelPct: prog.pct,
    earnedBadges: (user.earnedBadges as string[]) ?? [],
    badges: BADGES,
  }
}

export async function awardGamification(
  userId: string,
  event: {
    type: 'accent_shadowing' | 'accent_drill' | 'accent_coach' | 'interview' | 'rp_feature'
    accuracy?: number
    interviewScore?: number
    isPrepSession?: boolean
    featureId?: string
    featureMastered?: boolean
  }
): Promise<GamificationAward> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw new Error('User not found')

  let xpEarned = 0
  switch (event.type) {
    case 'accent_shadowing':
      xpEarned = XP_REWARDS.accent_shadowing(event.accuracy ?? 50)
      break
    case 'accent_drill':
      xpEarned = XP_REWARDS.accent_drill(event.accuracy ?? 50)
      break
    case 'accent_coach':
      xpEarned = XP_REWARDS.accent_coach()
      break
    case 'interview':
      xpEarned = XP_REWARDS.interview(event.interviewScore ?? 5)
      break
    case 'rp_feature':
      xpEarned = XP_REWARDS.rp_feature(event.accuracy ?? 50)
      if (event.featureMastered) xpEarned += 30
      break
  }

  const today = todayUtc()
  const yesterday = yesterdayUtc()
  let currentStreak = user.currentStreak ?? 0
  let longestStreak = user.longestStreak ?? 0
  let dailySessions = user.dailySessionsDate === today ? (user.dailySessions ?? 0) : 0

  if (user.lastPracticeDate === today) {
    // same day — streak unchanged
  } else if (user.lastPracticeDate === yesterday) {
    currentStreak += 1
  } else {
    currentStreak = 1
  }
  longestStreak = Math.max(longestStreak, currentStreak)

  dailySessions += 1
  const dailyGoal = user.dailyGoal ?? DAILY_GOAL_SESSIONS
  const dailyGoalMet = dailySessions >= dailyGoal

  const oldLevel = user.level ?? levelFromXp(user.xp ?? 0)
  const newXp = (user.xp ?? 0) + xpEarned
  const newLevel = levelFromXp(newXp)
  const leveledUp = newLevel > oldLevel

  const earned = new Set<string>((user.earnedBadges as string[]) ?? [])
  const newBadges: string[] = []

  function grant(id: string) {
    if (!earned.has(id)) {
      earned.add(id)
      newBadges.push(id)
    }
  }

  const accentCount = await countAccentAttempts(userId)
  const completedInterviews = await countCompletedInterviews(userId)

  if (accentCount >= 1 || completedInterviews >= 1) grant('first_practice')
  if (accentCount >= 10) grant('accent_10')
  if (accentCount >= 50) grant('accent_50')
  if (currentStreak >= 3) grant('streak_3')
  if (currentStreak >= 7) grant('streak_7')
  if (currentStreak >= 30) grant('streak_30')
  if (completedInterviews >= 1) grant('interview_first')
  if (event.isPrepSession) grant('interview_prep')
  if (newLevel >= 5) grant('level_5')
  if (newLevel >= 10) grant('level_10')
  if ((event.accuracy ?? 0) >= 80) grant('pronunciation_80')
  if (dailyGoalMet) grant('daily_goal')

  if (event.type === 'rp_feature') {
    grant('rp_apprentice')
    if (event.featureMastered && event.featureId) {
      const badgeMap: Record<string, string> = {
        non_rhotic_r: 'rp_non_rhotic',
        trap_bath: 'rp_trap_bath',
        lot_vowel: 'rp_lot',
        rp_prosody: 'rp_prosody',
      }
      const badge = badgeMap[event.featureId]
      if (badge) grant(badge)
    }
    const masteredRows = await db
      .select({ c: count() })
      .from(accentFeatureMastery)
      .where(and(eq(accentFeatureMastery.userId, userId), eq(accentFeatureMastery.status, 'mastered')))
    if (Number(masteredRows[0]?.c ?? 0) >= 11) grant('rp_graduate')
  }

  await db
    .update(users)
    .set({
      xp: newXp,
      level: newLevel,
      currentStreak,
      longestStreak,
      lastPracticeDate: today,
      dailySessions,
      dailySessionsDate: today,
      earnedBadges: Array.from(earned),
    })
    .where(eq(users.id, userId))

  return {
    xpEarned,
    leveledUp,
    newLevel,
    newBadges,
    currentStreak,
    dailySessions,
    dailyGoalMet,
  }
}
