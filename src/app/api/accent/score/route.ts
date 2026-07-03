import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { scoreTranscription } from '@/lib/accent/scoring'
import { transcribeAccentAudio } from '@/lib/accent/transcribe'
import { buildFluencyAnalysis } from '@/lib/accent/fluency'
import { generateAccentCoaching } from '@/lib/accent/feedback'
import { saveAccentAttempt } from '@/lib/db/queries'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      audioBase64,
      mimeType = 'audio/webm',
      durationSeconds,
      expected,
      accent,
      phraseId,
      mode,
    } = body as {
      audioBase64: string
      mimeType?: string
      durationSeconds?: number
      expected: string
      accent: 'british' | 'irish'
      phraseId: string
      mode: 'shadowing' | 'drill' | 'coach'
    }

    if (!audioBase64 || !expected || !accent || !phraseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64')
    if (audioBuffer.length < 100) {
      return NextResponse.json(
        { error: 'Recording too short or empty. Please speak clearly and try again.' },
        { status: 422 }
      )
    }

    const transcription = await transcribeAccentAudio(
      audioBuffer,
      mimeType,
      durationSeconds
    )

    if (!transcription.text) {
      return NextResponse.json(
        { error: 'No speech detected. Speak louder or move closer to the microphone.' },
        { status: 422 }
      )
    }

    const duration =
      transcription.durationSeconds ||
      durationSeconds ||
      Math.max(1, transcription.segments.at(-1)?.end ?? 1)

    const { wordScores, accuracy } = scoreTranscription(expected, transcription.text)
    const fluency = buildFluencyAnalysis(transcription.text, duration, transcription.segments)

    const coaching = await generateAccentCoaching({
      expected,
      transcribed: transcription.text,
      accent,
      wordScores,
      accuracy,
      fluency,
    })

    await saveAccentAttempt({
      id: randomUUID(),
      userId: session.user.id,
      phraseId,
      accent,
      mode: mode ?? 'shadowing',
      accuracy,
      transcribed: transcription.text,
      wordScores,
    })

    return NextResponse.json({
      transcribed: transcription.text,
      wordScores,
      accuracy,
      fluency,
      coaching,
      durationSeconds: duration,
    })
  } catch (err) {
    console.error('[accent/score]', err)
    const message =
      err instanceof Error ? err.message : 'Something went wrong while scoring your attempt.'
    const clientError =
      /too short|empty|no speech|could not transcribe|check your microphone/i.test(message)
    return NextResponse.json({ error: message }, { status: clientError ? 422 : 500 })
  }
}
