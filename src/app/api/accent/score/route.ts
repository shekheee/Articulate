import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { scoreTranscription } from '@/lib/accent/scoring'
import { transcribeAccentAudio } from '@/lib/accent/transcribe'
import { buildFluencyAnalysis } from '@/lib/accent/fluency'
import { analyzePhonetics } from '@/lib/accent/phonetics'
import { analyzeProsody } from '@/lib/accent/prosody'
import { generateAccentCoaching } from '@/lib/accent/feedback'
import { saveAccentAttempt } from '@/lib/db/queries'
import { awardGamification } from '@/lib/gamification/award'
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
    const prosody = analyzeProsody(
      transcription.segments,
      duration,
      expected.split(/\s+/).filter(Boolean).length
    )
    const phonetics = await analyzePhonetics({
      expected,
      transcribed: transcription.text,
      accent,
      wordScores,
    })

    const coaching = await generateAccentCoaching({
      expected,
      transcribed: transcription.text,
      accent,
      wordScores: phonetics.words,
      accuracy: phonetics.overallPhonemeScore,
      fluency,
      phonetics,
      prosody,
    })

    const fluencyScore = Math.max(
      0,
      Math.min(100, 100 - fluency.fillerRate * 2 - fluency.pauses.length * 4)
    )

    await saveAccentAttempt({
      id: randomUUID(),
      userId: session.user.id,
      phraseId,
      accent,
      mode: mode ?? 'shadowing',
      accuracy: phonetics.overallPhonemeScore,
      transcribed: transcription.text,
      wordScores: phonetics.words,
      metrics: {
        fluencyScore,
        pronunciationScore: phonetics.overallPhonemeScore,
        prosodyScore: prosody.score,
        wordsPerMinute: fluency.wordsPerMinute,
        totalFillers: fluency.totalFillers,
        pauseCount: fluency.pauses.length,
      },
    })

    const practiceMode = mode ?? 'shadowing'
    const gamification = await awardGamification(session.user.id, {
      type:
        practiceMode === 'drill'
          ? 'accent_drill'
          : practiceMode === 'coach'
            ? 'accent_coach'
            : 'accent_shadowing',
      accuracy: phonetics.overallPhonemeScore,
    })

    return NextResponse.json({
      transcribed: transcription.text,
      wordScores: phonetics.words,
      accuracy: phonetics.overallPhonemeScore,
      fluency,
      prosody,
      phonetics,
      coaching,
      durationSeconds: duration,
      gamification,
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
