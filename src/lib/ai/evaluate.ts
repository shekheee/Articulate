import { z } from 'zod'
import { generateEvaluation } from './providers'
import { buildEvaluationPrompt } from './prompts'
import type { InterviewType, Persona } from './prompts'

const FILLER_WORDS = [
  'um', 'uh', 'uhh', 'umm', 'er', 'ah', 'like', 'you know', 'you know what i mean',
  'sort of', 'kind of', 'basically', 'literally', 'actually', 'right', 'okay so',
  'so yeah', 'i mean', 'well', 'yeah so',
]

export interface SpeakingMetrics {
  fillerWords: Record<string, number>
  totalFillers: number
  fillerRate: number       // fillers per 100 words
  estimatedPauses: number  // rough count based on short transcript chunks
  wordsPerMinute: number
  observations: string[]
}

export function analyzeSpeaking(
  userTranscripts: string[],
  durationSeconds: number,
  overrides?: { allText?: string; pauseCount?: number }
): SpeakingMetrics {
  // If allText is provided (from raw Gemini chunks) use it; otherwise join utterances
  const fullText = (overrides?.allText ?? userTranscripts.join(' ')).toLowerCase()
  const words = fullText.split(/\s+/).filter(Boolean)
  const totalWords = words.length

  // Count filler words
  const fillerCounts: Record<string, number> = {}
  let totalFillers = 0

  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi')
    const matches = fullText.match(regex)
    if (matches && matches.length > 0) {
      fillerCounts[filler] = matches.length
      totalFillers += matches.length
    }
  }

  // Use timestamp-based pause count when available (accurate), else fall back to old heuristic
  const estimatedPauses = overrides?.pauseCount ?? userTranscripts.filter(
    (t) => t.split(/\s+/).filter(Boolean).length < 5 && t.split(/\s+/).filter(Boolean).length > 0
  ).length

  const wordsPerMinute = durationSeconds > 0
    ? Math.round((totalWords / durationSeconds) * 60)
    : 0

  const fillerRate = totalWords > 0 ? Math.round((totalFillers / totalWords) * 100) : 0

  // Build observations
  const observations: string[] = []
  if (wordsPerMinute > 0 && wordsPerMinute < 100) observations.push('Speaking pace is slow — try to speak more fluently.')
  if (wordsPerMinute > 180) observations.push('Speaking pace is very fast — slow down for clarity.')
  if (fillerRate > 10) observations.push(`High filler word usage (${fillerRate} per 100 words) — practice pausing silently instead.`)
  if (fillerCounts['like'] > 3) observations.push('"Like" used frequently — a common habit to reduce.')
  if (fillerCounts['um'] > 3 || fillerCounts['uh'] > 3) observations.push('Frequent "um/uh" — try pausing silently instead of vocalising hesitation.')
  if (estimatedPauses > 5) observations.push('Several short/fragmented responses detected — try to complete thoughts before speaking.')
  if (observations.length === 0) observations.push('Good speaking fluency overall.')

  return {
    fillerWords: fillerCounts,
    totalFillers,
    fillerRate,
    estimatedPauses,
    wordsPerMinute,
    observations,
  }
}

export const evaluationSchema = z.object({
  clarityScore: z.number().min(1).max(10),
  structureScore: z.number().min(1).max(10),
  confidenceScore: z.number().min(1).max(10),
  depthScore: z.number().min(1).max(10),
  fluencyScore: z.number().min(1).max(10),
  overallScore: z.number().min(1).max(10),
  strengths: z.array(z.string()).min(1).max(5),
  weaknesses: z.array(z.string()).min(1).max(5),
  suggestions: z.array(z.string()).min(1).max(5),
  speakingCoaching: z.array(z.string()).min(1).max(6),
  perQuestion: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      score: z.number().min(1).max(10),
      contentScore: z.number().min(1).max(10).optional(),
      feedback: z.string(),
      improvements: z.array(z.string()),
      modelAnswer: z.string().optional(),
    })
  ),
})

export type EvaluationResult = z.infer<typeof evaluationSchema>

export async function runEvaluation(
  type: InterviewType,
  persona: Persona,
  transcript: Array<{ role: 'ai' | 'user'; content: string }>,
  speakingMetrics?: SpeakingMetrics,
  round?: string
): Promise<EvaluationResult & { speakingMetrics?: SpeakingMetrics }> {
  const system = `You are an expert interview coach providing structured, honest feedback. 
Return ONLY valid JSON matching the schema exactly. Be precise with scores — avoid clustering everything at 7.`

  const prompt = buildEvaluationPrompt(type, persona, transcript, speakingMetrics, round)

  const result = await generateEvaluation(system, prompt, evaluationSchema)
  return { ...(result.object as EvaluationResult), speakingMetrics }
}
