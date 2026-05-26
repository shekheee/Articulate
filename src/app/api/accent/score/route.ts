import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { scoreTranscription } from '@/lib/accent/scoring'
import { saveAccentAttempt } from '@/lib/db/queries'
import { randomUUID } from 'crypto'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { audioBase64, expected, accent, phraseId, mode } = await req.json() as {
    audioBase64: string
    expected: string
    accent: 'british' | 'irish'
    phraseId: string
    mode: 'shadowing' | 'drill' | 'coach'
  }

  if (!audioBase64 || !expected || !accent || !phraseId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Decode base64 WAV → Buffer for Whisper
  const wavBuffer = Buffer.from(audioBase64, 'base64')
  const wavFile = new File([wavBuffer], 'attempt.wav', { type: 'audio/wav' })

  const whisperResult = await openai.audio.transcriptions.create({
    file: wavFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'text',
  })

  const transcribed = typeof whisperResult === 'string' ? whisperResult : (whisperResult as { text: string }).text ?? ''

  const { wordScores, accuracy } = scoreTranscription(expected, transcribed)

  // Persist
  await saveAccentAttempt({
    id: randomUUID(),
    userId: session.user.id,
    phraseId,
    accent,
    mode: mode ?? 'shadowing',
    accuracy,
    transcribed,
    wordScores,
  })

  return NextResponse.json({ transcribed, wordScores, accuracy })
}
