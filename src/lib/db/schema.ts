import {
  pgTable,
  text,
  timestamp,
  integer,
  json,
  pgEnum,
  smallint,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────

export const interviewTypeEnum = pgEnum('interview_type', [
  'behavioral',
  'dsa',
  'system_design',
  'case_study',
])

export const difficultyEnum = pgEnum('difficulty', ['junior', 'mid', 'senior'])

export const sessionStatusEnum = pgEnum('session_status', [
  'in_progress',
  'completed',
  'abandoned',
])

export const messageRoleEnum = pgEnum('message_role', ['ai', 'user'])

export const accentEnum = pgEnum('accent', ['british', 'irish'])
export const accentModeEnum = pgEnum('accent_mode', ['shadowing', 'drill', 'coach'])

// ─── Tables ───────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
  resumeContext: text('resume_context'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
})

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const interviewSessions = pgTable('interview_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: interviewTypeEnum('type').notNull(),
  persona: text('persona').notNull().default('google'),
  difficulty: difficultyEnum('difficulty').notNull().default('mid'),
  status: sessionStatusEnum('status').notNull().default('in_progress'),
  overallScore: integer('overall_score'),
  questionCount: integer('question_count').notNull().default(5),
  company: text('company').default('generic').notNull(),
  round: text('round').default('general').notNull(),
  resumeContext: text('resume_context'),
  customQuestions: json('custom_questions').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { mode: 'date' }),
})

export const sessionMessages = pgTable('session_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => interviewSessions.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const sessionEvaluations = pgTable('session_evaluations', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => interviewSessions.id, { onDelete: 'cascade' })
    .unique(),
  clarityScore: integer('clarity_score').notNull(),
  structureScore: integer('structure_score').notNull(),
  confidenceScore: integer('confidence_score').notNull(),
  depthScore: integer('depth_score').notNull(),
  fluencyScore: integer('fluency_score').notNull().default(0),
  overallScore: integer('overall_score').notNull(),
  strengths: json('strengths').$type<string[]>().notNull().default([]),
  weaknesses: json('weaknesses').$type<string[]>().notNull().default([]),
  suggestions: json('suggestions').$type<string[]>().notNull().default([]),
  speakingMetrics: json('speaking_metrics')
    .$type<{
      fillerWords: Record<string, number>
      totalFillers: number
      fillerRate: number
      estimatedPauses: number
      wordsPerMinute: number
      observations: string[]
    }>()
    .default(null),
  perQuestion: json('per_question')
    .$type<
      Array<{
        question: string
        answer: string
        score: number
        feedback: string
        improvements: string[]
      }>
    >()
    .notNull()
    .default([]),
  speakingCoaching: json('speaking_coaching')
    .$type<string[]>()
    .notNull()
    .default([]),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

// ─── Types ────────────────────────────────────────────────────────────────

export const accentAttempts = pgTable('accent_attempts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  phraseId: text('phrase_id').notNull(),          // e.g. "brit_bath_01"
  accent: accentEnum('accent').notNull(),
  mode: accentModeEnum('mode').notNull(),
  accuracy: smallint('accuracy').notNull(),        // 0–100
  transcribed: text('transcribed').notNull(),      // what Whisper heard
  wordScores: json('word_scores').$type<Array<{ word: string; matched: boolean; score: number }>>().notNull().default([]),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

// ─── Types ────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type InterviewSession = typeof interviewSessions.$inferSelect
export type SessionMessage = typeof sessionMessages.$inferSelect
export type SessionEvaluation = typeof sessionEvaluations.$inferSelect
export type AccentAttempt = typeof accentAttempts.$inferSelect
