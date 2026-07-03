import { z } from 'zod'
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import type { RPFeature } from './types'
import type { ContrastiveFeedback } from './types'
import type { PhoneticsAnalysis } from '@/lib/accent/phonetics'
import type { FluencyAnalysis } from '@/lib/accent/fluency'

const contrastiveSchema = z.object({
  featureScore: z.number().min(0).max(100),
  passedFeature: z.boolean(),
  summary: z.string(),
  whatYouProduced: z.string(),
  rpTarget: z.string(),
  contrastiveNotes: z.array(z.string()).min(1).max(5),
  articulatoryCues: z.array(z.string()).min(1).max(4),
  wordFeedback: z
    .array(
      z.object({
        word: z.string(),
        issue: z.string(),
        cue: z.string(),
      })
    )
    .min(0)
    .max(6),
  nextDrill: z.string(),
})

async function generateWithProvider(system: string, prompt: string) {
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
        schema: contrastiveSchema,
      })
      return object
    } catch (err) {
      console.warn('[rp/contrastive]', (err as Error).message)
    }
  }
  return null
}

export async function generateContrastiveFeedback(params: {
  feature: RPFeature
  expected: string
  transcribed: string
  focusWords: string[]
  phonetics?: PhoneticsAnalysis
  fluency?: FluencyAnalysis
  wordMatchScore: number
}): Promise<ContrastiveFeedback> {
  const { feature, expected, transcribed, focusWords, phonetics, fluency, wordMatchScore } = params

  const phonemeLines =
    phonetics?.words
      .filter((w) => focusWords.some((f) => w.word.toLowerCase().includes(f.toLowerCase())))
      .slice(0, 6)
      .map((w) => `${w.word}: target context ${feature.targetIpa}, heard as ${w.heardAs ?? w.word}, IPA ${w.ipa}, issues: ${w.issues?.join('; ') ?? 'none'}`) ?? []

  const system = `You are an expert British RP (Received Pronunciation) accent acquisition coach.
Your job is CONTRASTIVE feedback: compare what the learner produced against the RP target for ONE specific phonological feature.
Be concrete and articulatory — e.g. "you're producing a rhotic R in 'car' — in RP the coda R is dropped; aim for /kɑː/".
Do NOT give generic pronunciation scores. Focus ONLY on the feature being trained.
Return JSON only.`

  const prompt = `FEATURE UNIT: ${feature.title}
RULE: ${feature.rule}
TARGET IPA: ${feature.targetIpa}
ARTICULATORY TIPS: ${feature.articulatoryTips.join(' | ')}
FOCUS WORDS IN PHRASE: ${focusWords.join(', ')}

Expected phrase: "${expected}"
What Whisper transcribed: "${transcribed}"
Word-level match score (secondary): ${wordMatchScore}%

${phonemeLines.length ? `Phoneme hints (LLM approximation — not clinical assessment):\n${phonemeLines.join('\n')}` : ''}
${fluency ? `Fluency: ${fluency.wordsPerMinute} WPM, ${fluency.totalFillers} fillers.` : ''}

Give contrastive feedback focused ONLY on "${feature.shortTitle}".
Set passedFeature true if featureScore >= 75 and the main feature errors are minor.
Set featureScore 0-100 for how well they hit THIS feature (not overall accent).
whatYouProduced: describe their accent pattern on the focus feature in plain English.
rpTarget: describe what native RP would do on the same words.
nextDrill: one specific micro-drill sentence or exercise.`

  const llm = await generateWithProvider(system, prompt)
  if (llm) return llm

  const passed = wordMatchScore >= 70
  return {
    featureScore: Math.round(wordMatchScore * 0.7 + (passed ? 25 : 10)),
    passedFeature: passed,
    summary: passed
      ? `Good progress on ${feature.shortTitle} — keep refining the target sound.`
      : `Focus on ${feature.shortTitle}: ${feature.rule.slice(0, 120)}…`,
    whatYouProduced: `Transcription matched "${transcribed}" — check focus words: ${focusWords.join(', ')}.`,
    rpTarget: feature.rule,
    contrastiveNotes: feature.articulatoryTips.slice(0, 2),
    articulatoryCues: feature.articulatoryTips,
    wordFeedback: focusWords.slice(0, 3).map((w) => ({
      word: w,
      issue: `May not match RP ${feature.shortTitle}`,
      cue: feature.articulatoryTips[0] ?? 'Listen to the model and shadow slowly.',
    })),
    nextDrill: `Repeat slowly: "${expected}" — exaggerate ${feature.shortTitle} on ${focusWords[0] ?? 'each word'}.`,
  }
}
