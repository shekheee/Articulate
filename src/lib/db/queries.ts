import { db } from './index'
import { interviewSessions, sessionMessages, sessionEvaluations, users, accentAttempts, accentFeatureMastery } from './schema'
import { eq, desc, and, avg, max } from 'drizzle-orm'
import type { InterviewSession, SessionMessage, SessionEvaluation, AccentAttempt, AccentFeatureMastery } from './schema'
import type { SpeakingMetrics } from '@/lib/ai/evaluate'

export async function createSession(data: {
  id: string
  userId: string
  type: 'behavioral' | 'dsa' | 'system_design' | 'case_study'
  persona: string
  difficulty: 'junior' | 'mid' | 'senior'
  questionCount: number
  company?: string
  round?: string
  resumeContext?: string | null
  customQuestions?: string[]
}): Promise<InterviewSession> {
  const [session] = await db.insert(interviewSessions).values(data).returning()
  return session
}

export async function getSession(id: string): Promise<InterviewSession | null> {
  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, id))
    .limit(1)
  return session ?? null
}

export async function getUserSessions(userId: string): Promise<InterviewSession[]> {
  return db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId))
    .orderBy(desc(interviewSessions.createdAt))
}

export async function completeSession(
  id: string,
  overallScore: number
): Promise<void> {
  await db
    .update(interviewSessions)
    .set({ status: 'completed', overallScore, completedAt: new Date() })
    .where(eq(interviewSessions.id, id))
}

export async function addMessage(data: {
  id: string
  sessionId: string
  role: 'ai' | 'user'
  content: string
  order: number
}): Promise<SessionMessage> {
  const [msg] = await db.insert(sessionMessages).values(data).returning()
  return msg
}

export async function getMessages(sessionId: string): Promise<SessionMessage[]> {
  return db
    .select()
    .from(sessionMessages)
    .where(eq(sessionMessages.sessionId, sessionId))
    .orderBy(sessionMessages.order)
}

export async function saveEvaluation(data: {
  id: string
  sessionId: string
  clarityScore: number
  structureScore: number
  confidenceScore: number
  depthScore: number
  fluencyScore: number
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  speakingCoaching: string[]
  perQuestion: Array<{
    question: string
    answer: string
    score: number
    feedback: string
    improvements: string[]
  }>
  speakingMetrics: SpeakingMetrics | null
}): Promise<SessionEvaluation> {
  const [evaluation] = await db.insert(sessionEvaluations).values(data).returning()
  return evaluation
}

export async function getEvaluation(sessionId: string): Promise<SessionEvaluation | null> {
  const [evaluation] = await db
    .select()
    .from(sessionEvaluations)
    .where(eq(sessionEvaluations.sessionId, sessionId))
    .limit(1)
  return evaluation ?? null
}

export async function getSessionWithEvaluation(sessionId: string) {
  const session = await getSession(sessionId)
  if (!session) return null
  const messages = await getMessages(sessionId)
  const evaluation = await getEvaluation(sessionId)
  return { session, messages, evaluation }
}

export async function saveUserResume(userId: string, resumeContext: string): Promise<void> {
  await db.update(users).set({ resumeContext }).where(eq(users.id, userId))
}

export async function getUserResume(userId: string): Promise<string | null> {
  const [user] = await db.select({ resumeContext: users.resumeContext }).from(users).where(eq(users.id, userId)).limit(1)
  return user?.resumeContext ?? null
}

export async function deleteSession(id: string, userId: string): Promise<void> {
  // Delete cascade: messages → evaluation → session (all scoped to userId for safety)
  await db.delete(sessionMessages).where(eq(sessionMessages.sessionId, id))
  await db.delete(sessionEvaluations).where(eq(sessionEvaluations.sessionId, id))
  await db.delete(interviewSessions).where(
    and(eq(interviewSessions.id, id), eq(interviewSessions.userId, userId))
  )
}

// ─── Accent ───────────────────────────────────────────────────────────────

export async function saveAccentAttempt(data: {
  id: string
  userId: string
  phraseId: string
  accent: 'british' | 'irish'
  mode: 'shadowing' | 'drill' | 'coach'
  accuracy: number
  transcribed: string
  wordScores: Array<{ word: string; matched: boolean; score: number; ipa?: string; heardAs?: string; phonemeTip?: string; issues?: string[] }>
  metrics?: {
    fluencyScore?: number
    pronunciationScore?: number
    prosodyScore?: number
    wordsPerMinute?: number
    totalFillers?: number
    pauseCount?: number
    featureId?: string
    featureScore?: number
    passedFeature?: boolean
  } | null
}): Promise<AccentAttempt> {
  const [attempt] = await db.insert(accentAttempts).values(data).returning()
  return attempt
}

export async function getUserAccentAttempts(userId: string): Promise<AccentAttempt[]> {
  return db
    .select()
    .from(accentAttempts)
    .where(eq(accentAttempts.userId, userId))
    .orderBy(desc(accentAttempts.createdAt))
}

export async function getPhraseBestScores(
  userId: string,
  accent: 'british' | 'irish'
): Promise<Array<{ phraseId: string; bestScore: number; avgScore: number; attempts: number }>> {
  const rows = await db
    .select({
      phraseId: accentAttempts.phraseId,
      bestScore: max(accentAttempts.accuracy),
      avgScore: avg(accentAttempts.accuracy),
      attempts: accentAttempts.id,
    })
    .from(accentAttempts)
    .where(and(eq(accentAttempts.userId, userId), eq(accentAttempts.accent, accent)))

  // Group manually since drizzle count requires groupBy syntax
  const map = new Map<string, { bestScore: number; avgScore: number; attempts: number }>()
  for (const r of rows) {
    if (!r.phraseId) continue
    const existing = map.get(r.phraseId)
    if (!existing) {
      map.set(r.phraseId, {
        bestScore: Number(r.bestScore ?? 0),
        avgScore: Math.round(Number(r.avgScore ?? 0)),
        attempts: 1,
      })
    }
  }
  return Array.from(map.entries()).map(([phraseId, v]) => ({ phraseId, ...v }))
}

export async function getAccentAttemptsByPhrase(
  userId: string,
  phraseId: string
): Promise<AccentAttempt[]> {
  return db
    .select()
    .from(accentAttempts)
    .where(and(eq(accentAttempts.userId, userId), eq(accentAttempts.phraseId, phraseId)))
    .orderBy(desc(accentAttempts.createdAt))
    .limit(10)
}

// ─── RP feature mastery ───────────────────────────────────────────────────

export async function getUserFeatureMastery(
  userId: string,
  accentTarget = 'rp'
): Promise<AccentFeatureMastery[]> {
  return db
    .select()
    .from(accentFeatureMastery)
    .where(and(eq(accentFeatureMastery.userId, userId), eq(accentFeatureMastery.accentTarget, accentTarget)))
}

export async function upsertFeatureMastery(data: {
  id: string
  userId: string
  accentTarget: string
  featureId: string
  masteryScore: number
  bestScore: number
  status: string
  attemptCount: number
  lastPracticedAt: Date
  nextReviewAt: Date | null
}): Promise<AccentFeatureMastery> {
  const existing = await db
    .select()
    .from(accentFeatureMastery)
    .where(
      and(
        eq(accentFeatureMastery.userId, data.userId),
        eq(accentFeatureMastery.accentTarget, data.accentTarget),
        eq(accentFeatureMastery.featureId, data.featureId)
      )
    )
    .limit(1)

  if (existing[0]) {
    const [row] = await db
      .update(accentFeatureMastery)
      .set({
        masteryScore: data.masteryScore,
        bestScore: data.bestScore,
        status: data.status,
        attemptCount: data.attemptCount,
        lastPracticedAt: data.lastPracticedAt,
        nextReviewAt: data.nextReviewAt,
      })
      .where(eq(accentFeatureMastery.id, existing[0].id))
      .returning()
    return row
  }

  const [row] = await db.insert(accentFeatureMastery).values(data).returning()
  return row
}
