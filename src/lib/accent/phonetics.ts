import { z } from 'zod'
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import type { WordScore } from '@/lib/accent/scoring'

export interface PhonemeWordAnalysis extends WordScore {
  ipa: string
  heardAs: string
  phonemeTip: string
  issues: string[]
}

export interface MinimalPairDrill {
  sound: string
  label: string
  pair: [string, string]
  practicePhrase: string
}

export interface PhoneticsAnalysis {
  words: PhonemeWordAnalysis[]
  strugglingSounds: string[]
  minimalPairs: MinimalPairDrill[]
  overallPhonemeScore: number
  disclaimer: string
}

const phoneticsSchema = z.object({
  words: z.array(
    z.object({
      word: z.string(),
      ipa: z.string(),
      heardAs: z.string(),
      score: z.number().min(0).max(100),
      issues: z.array(z.string()),
      phonemeTip: z.string(),
    })
  ),
  strugglingSounds: z.array(z.string()).max(5),
  minimalPairs: z
    .array(
      z.object({
        sound: z.string(),
        label: z.string(),
        wordA: z.string(),
        wordB: z.string(),
        practicePhrase: z.string(),
      })
    )
    .max(3),
})

async function llmPhonetics(
  system: string,
  prompt: string
): Promise<z.infer<typeof phoneticsSchema> | null> {
  const tries = [
    () => createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })('claude-haiku-4-5'),
    () => createOpenAI({ apiKey: process.env.OPENAI_API_KEY })('gpt-4o-mini'),
  ]
  for (let i = 0; i < tries.length; i++) {
    const key = i === 0 ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY
    if (!key || key.startsWith('your_')) continue
    try {
      const { object } = await generateObject({
        model: tries[i](),
        system,
        prompt,
        schema: phoneticsSchema,
      })
      return object
    } catch (err) {
      console.warn('[accent/phonetics] LLM failed:', (err as Error).message)
    }
  }
  return null
}

/** Approximate phoneme analysis via LLM + transcript alignment (not a dedicated ASR phonetics engine). */
export async function analyzePhonetics(params: {
  expected: string
  transcribed: string
  accent: 'british' | 'irish'
  wordScores: WordScore[]
}): Promise<PhoneticsAnalysis> {
  const { expected, transcribed, accent, wordScores } = params
  const accentLabel = accent === 'british' ? 'British RP' : 'Irish English'

  const system = `You are an expert ${accentLabel} phonetics coach. Provide IPA (standard IPA notation) for target words in ${accentLabel}. Compare expected vs what was heard. Identify substitutions, omissions, and vowel errors. Be specific and practical. This is an approximation from speech-to-text, not acoustic phoneme alignment.`

  const prompt = `Target phrase: "${expected}"
Transcript (STT): "${transcribed}"
Word alignment scores: ${JSON.stringify(wordScores)}

For EACH word in the target phrase, provide:
- ipa: correct ${accentLabel} IPA
- heardAs: what the transcript suggests they said (IPA or phonetic spelling)
- score: 0-100 pronunciation match for that word
- issues: specific phoneme-level problems (e.g. "rhotic /r/ inserted", "BATH vowel too short")
- phonemeTip: one concrete mouth/tongue tip

Also identify strugglingSounds (1-5 IPA symbols or labels) and up to 3 minimalPairs drills for the worst sounds.`

  const llm = await llmPhonetics(system, prompt)

  if (llm) {
    const words: PhonemeWordAnalysis[] = llm.words.map((w) => ({
      word: w.word,
      matched: w.score >= 85,
      score: w.score,
      ipa: w.ipa,
      heardAs: w.heardAs,
      phonemeTip: w.phonemeTip,
      issues: w.issues,
    }))
    const overallPhonemeScore =
      words.length > 0 ? Math.round(words.reduce((s, w) => s + w.score, 0) / words.length) : 0

    return {
      words,
      strugglingSounds: llm.strugglingSounds,
      minimalPairs: llm.minimalPairs.map((p) => ({
        sound: p.sound,
        label: p.label,
        pair: [p.wordA, p.wordB] as [string, string],
        practicePhrase: p.practicePhrase,
      })),
      overallPhonemeScore,
      disclaimer:
        'Phoneme feedback is inferred from speech-to-text and LLM analysis — a strong approximation, not acoustic phoneme scoring (Azure/Deepgram would be more precise).',
    }
  }

  // Rule-based fallback from word scores
  const words: PhonemeWordAnalysis[] = wordScores.map((w) => ({
    ...w,
    ipa: `/${w.word}/`,
    heardAs: w.matched ? `/${w.word}/` : '(unclear)',
    phonemeTip: w.matched ? 'Clear articulation.' : `Slow down and exaggerate the vowels in "${w.word}".`,
    issues: w.matched ? [] : [`"${w.word}" was not matched clearly in the transcript`],
  }))

  return {
    words,
    strugglingSounds: [],
    minimalPairs: [],
    overallPhonemeScore: wordScores.length
      ? Math.round(wordScores.reduce((s, w) => s + w.score, 0) / wordScores.length)
      : 0,
    disclaimer:
      'Phoneme feedback is approximate (transcript-based). LLM phonetics unavailable.',
  }
}
