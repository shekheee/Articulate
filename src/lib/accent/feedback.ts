import { z } from 'zod'
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import type { FluencyAnalysis } from '@/lib/accent/fluency'
import type { WordScore } from '@/lib/accent/scoring'
import { formatFluencySummary } from '@/lib/accent/fluency'

const accentFeedbackSchema = z.object({
  overallSummary: z.string(),
  pronunciationNotes: z.array(z.string()).min(1).max(4),
  fluencyNotes: z.array(z.string()).min(1).max(4),
  priorityImprovements: z.array(z.string()).min(2).max(4),
  modelPhrase: z.string().optional(),
})

export type AccentCoachingFeedback = z.infer<typeof accentFeedbackSchema>

async function generateWithProvider(
  system: string,
  prompt: string
): Promise<AccentCoachingFeedback | null> {
  const providers = [
    () =>
      createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })('claude-haiku-4-5'),
    () => createOpenAI({ apiKey: process.env.OPENAI_API_KEY })('gpt-4o-mini'),
  ]

  for (const getModel of providers) {
    const key =
      getModel === providers[0]
        ? process.env.ANTHROPIC_API_KEY
        : process.env.OPENAI_API_KEY
    if (!key || key.startsWith('your_')) continue

    try {
      const { object } = await generateObject({
        model: getModel(),
        system,
        prompt,
        schema: accentFeedbackSchema,
      })
      return object
    } catch (err) {
      console.warn('[accent/feedback] LLM failed:', (err as Error).message)
    }
  }
  return null
}

export async function generateAccentCoaching(params: {
  expected: string
  transcribed: string
  accent: 'british' | 'irish'
  wordScores: WordScore[]
  accuracy: number
  fluency: FluencyAnalysis
  tip?: string
}): Promise<AccentCoachingFeedback> {
  const { expected, transcribed, accent, wordScores, accuracy, fluency, tip } = params
  const accentLabel = accent === 'british' ? 'British RP (Received Pronunciation)' : 'Irish English'
  const weakWords = wordScores.filter((w) => w.score < 85).map((w) => `${w.word} (${w.score}%)`)
  const fluencyLines = formatFluencySummary(fluency)

  const system = `You are an expert ${accentLabel} pronunciation and speaking coach. Give concise, actionable feedback based on transcription and metrics. Be encouraging but specific. Return JSON only.`

  const prompt = `Expected phrase: "${expected}"
What we heard: "${transcribed}"
Pronunciation accuracy: ${accuracy}%
Weak words: ${weakWords.length ? weakWords.join(', ') : 'none — good match'}
${tip ? `Phrase tip: ${tip}` : ''}

Fluency metrics:
${fluencyLines.join('\n')}
Filler breakdown: ${JSON.stringify(fluency.fillerWords)}
Observations: ${fluency.observations.join('; ')}

Provide coaching for a learner practising ${accentLabel}. Include a modelPhrase showing how a native speaker would say the expected phrase naturally (optional if accuracy is already high).`

  const llm = await generateWithProvider(system, prompt)
  if (llm) return llm

  // Rule-based fallback when LLM unavailable
  return {
    overallSummary:
      accuracy >= 75
        ? `Good attempt at ${accentLabel} — ${accuracy}% word match. Focus on the highlighted weak words.`
        : `Keep practising — ${accuracy}% match. Compare your recording to the model phrase.`,
    pronunciationNotes: weakWords.length
      ? weakWords.slice(0, 3).map((w) => `Work on "${w.split(' ')[0]}" — clarity was below target.`)
      : ['Pronunciation matched well — maintain this clarity.'],
    fluencyNotes: fluency.observations.slice(0, 3),
    priorityImprovements: [
      weakWords[0] ? `Drill the word "${weakWords[0].split(' ')[0]}" slowly, then at natural speed.` : 'Record again focusing on vowel length.',
      fluency.totalFillers > 3 ? 'Replace filler words with silent pauses.' : 'Keep your pace steady and finish each word cleanly.',
    ],
    modelPhrase: expected,
  }
}
