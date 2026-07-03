import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { buildFluencyAnalysis } from '@/lib/accent/fluency'
import { analyzePhonetics } from '@/lib/accent/phonetics'
import { scoreTranscription } from '@/lib/accent/scoring'
import { generateAccentCoaching } from '@/lib/accent/feedback'
import { saveAccentAttempt } from '@/lib/db/queries'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { accent, transcript, speakingData } = await req.json() as {
      accent: 'british' | 'irish'
      transcript: Array<{ role: 'ai' | 'user'; content: string }>
      speakingData?: {
        allText?: string
        pauseCount?: number
        durationSeconds?: number
        transcripts?: string[]
      }
    }

    if (!accent || !Array.isArray(transcript) || transcript.length < 2) {
      return NextResponse.json({ error: 'Need accent and conversation transcript' }, { status: 400 })
    }

    const userText = transcript
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ')
      .trim()

    if (!userText) {
      return NextResponse.json({ error: 'No user speech captured in this session.' }, { status: 422 })
    }

    const duration = speakingData?.durationSeconds ?? Math.max(30, Math.round(userText.split(/\s+/).length / 2))
    const fluency = buildFluencyAnalysis(
      speakingData?.allText ?? userText,
      duration,
      []
    )
    if (speakingData?.pauseCount != null) {
      fluency.estimatedPauses = speakingData.pauseCount
    }

    const { wordScores, accuracy } = scoreTranscription(userText, userText)
    const phonetics = await analyzePhonetics({
      expected: userText,
      transcribed: userText,
      accent,
      wordScores,
    })

    const coaching = await generateAccentCoaching({
      expected: 'Free conversation',
      transcribed: userText,
      accent,
      wordScores: phonetics.words,
      accuracy: phonetics.overallPhonemeScore,
      fluency,
    })

    await saveAccentAttempt({
      id: randomUUID(),
      userId: session.user.id,
      phraseId: `coach_${Date.now()}`,
      accent,
      mode: 'coach',
      accuracy: phonetics.overallPhonemeScore,
      transcribed: userText.slice(0, 500),
      wordScores: phonetics.words,
      metrics: {
        fluencyScore: Math.max(0, 100 - fluency.fillerRate * 2 - fluency.pauses.length * 3),
        pronunciationScore: phonetics.overallPhonemeScore,
        prosodyScore: 70,
        wordsPerMinute: fluency.wordsPerMinute,
        totalFillers: fluency.totalFillers,
        pauseCount: fluency.pauses.length,
      },
    })

    return NextResponse.json({
      fluency,
      phonetics,
      coaching,
      userWordCount: userText.split(/\s+/).filter(Boolean).length,
      durationSeconds: duration,
    })
  } catch (err) {
    console.error('[accent/coach-summary]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Summary failed' },
      { status: 500 }
    )
  }
}
