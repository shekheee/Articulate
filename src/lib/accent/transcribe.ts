import OpenAI from 'openai'
import { extensionForMime } from '@/lib/accent/audio'
import type { TranscriptSegment } from '@/lib/accent/fluency'

export interface TranscriptionResult {
  text: string
  segments: TranscriptSegment[]
  durationSeconds: number
  provider: 'openai' | 'gemini'
}

interface WhisperVerbose {
  text?: string
  segments?: Array<{ start: number; end: number; text: string }>
  duration?: number
}

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  if (!key || key.startsWith('your_')) return null
  return new OpenAI({ apiKey: key })
}

async function transcribeWithOpenAI(
  buffer: Buffer,
  mimeType: string
): Promise<TranscriptionResult | null> {
  const openai = getOpenAI()
  if (!openai) return null

  const ext = extensionForMime(mimeType)
  const file = new File([new Uint8Array(buffer)], `recording.${ext}`, { type: mimeType })

  try {
    const result = (await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
      temperature: 0,
    })) as WhisperVerbose

    const segments: TranscriptSegment[] = (result.segments ?? []).map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }))

    return {
      text: (result.text ?? '').trim(),
      segments,
      durationSeconds: result.duration ?? (segments.at(-1)?.end ?? 0),
      provider: 'openai',
    }
  } catch (err) {
    console.warn('[accent/transcribe] OpenAI Whisper failed:', (err as Error).message)
    return null
  }
}

async function transcribeWithGemini(
  buffer: Buffer,
  mimeType: string
): Promise<TranscriptionResult | null> {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!key || key.startsWith('your_')) return null

  try {
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey: key })
    const base64 = buffer.toString('base64')

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType.startsWith('audio/') ? mimeType : 'audio/webm',
            data: base64,
          },
        },
        {
          text: 'Transcribe this English speech verbatim. Include filler words (um, uh, like) if spoken. Return ONLY the transcript text.',
        },
      ],
    })

    const text = response.text?.trim() ?? ''
    if (!text) return null

    return {
      text,
      segments: [{ start: 0, end: 0, text }],
      durationSeconds: 0,
      provider: 'gemini',
    }
  } catch (err) {
    console.warn('[accent/transcribe] Gemini failed:', (err as Error).message)
    return null
  }
}

export async function transcribeAccentAudio(
  audioBuffer: Buffer,
  mimeType: string,
  durationSecondsHint?: number
): Promise<TranscriptionResult> {
  if (audioBuffer.length < 100) {
    throw new Error('Recording too short or empty. Please speak clearly and try again.')
  }

  const openaiResult = await transcribeWithOpenAI(audioBuffer, mimeType)
  if (openaiResult?.text) {
    return {
      ...openaiResult,
      durationSeconds: openaiResult.durationSeconds || durationSecondsHint || 0,
    }
  }

  const geminiResult = await transcribeWithGemini(audioBuffer, mimeType)
  if (geminiResult?.text) {
    return {
      ...geminiResult,
      durationSeconds: durationSecondsHint ?? geminiResult.durationSeconds,
    }
  }

  throw new Error(
    'Could not transcribe your speech. Check your microphone and try again, or retry in a few seconds.'
  )
}
