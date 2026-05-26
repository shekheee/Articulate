import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGroq } from '@ai-sdk/groq'
import { streamText, generateObject, type LanguageModel } from 'ai'
import { z } from 'zod'

type Provider = 'gemini' | 'groq' | 'openai' | 'anthropic'

function getModel(provider: Provider): LanguageModel {
  switch (provider) {
    case 'gemini':
      return createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      })('gemini-2.5-flash')
    case 'groq':
      return createGroq({ apiKey: process.env.GROQ_API_KEY })(
        'llama-3.3-70b-versatile'
      )
    case 'openai':
      return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })('gpt-4o-mini')
    case 'anthropic':
      return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(
        'claude-haiku-4-5'
      )
  }
}

// Some providers need json mode instead of schema-enforced structured output
function getEvalModel(provider: Provider): LanguageModel {
  switch (provider) {
    case 'gemini':
      return createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      })('gemini-2.5-flash')
    case 'groq':
      // llama-3.3-70b-versatile supports json_schema structured outputs
      return createGroq({ apiKey: process.env.GROQ_API_KEY })(
        'llama-3.3-70b-versatile'
      )
    case 'openai':
      return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })('gpt-4o-mini')
    case 'anthropic':
      return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(
        'claude-haiku-4-5'
      )
  }
}

const PROVIDER_ORDER: Provider[] = ['gemini', 'groq', 'openai', 'anthropic']

export async function streamInterviewResponse(
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  for (const provider of PROVIDER_ORDER) {
    if (!hasKey(provider)) continue
    try {
      return await streamText({
        model: getModel(provider),
        system,
        messages,
      })
    } catch (err) {
      console.warn(`[AI] Provider ${provider} failed:`, (err as Error).message)
    }
  }
  throw new Error('All AI providers failed')
}

export async function generateEvaluation(
  system: string,
  prompt: string,
  schema: z.ZodTypeAny
) {
  for (const provider of PROVIDER_ORDER) {
    if (!hasKey(provider)) continue
    try {
      return await generateObject({
        model: getEvalModel(provider),
        // Groq's llama models don't support json_schema response_format — use tool calling instead
        ...(provider === 'groq' ? { mode: 'tool' as const } : {}),
        system,
        prompt,
        schema,
      })
    } catch (err) {
      console.warn(`[AI] Provider ${provider} failed for evaluation:`, (err as Error).message)
    }
  }
  throw new Error('All AI providers failed for evaluation')
}

function hasKey(provider: Provider): boolean {
  const map: Record<Provider, string | undefined> = {
    gemini: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  }
  const val = map[provider]
  return !!val && !val.startsWith('your_')
}
