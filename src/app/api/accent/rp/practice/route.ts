import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { transcribeAccentAudio } from '@/lib/accent/transcribe'
import { scoreTranscription } from '@/lib/accent/scoring'
import { buildFluencyAnalysis } from '@/lib/accent/fluency'
import { analyzePhonetics } from '@/lib/accent/phonetics'
import {
  getRPFeature,
  getPracticePhrase,
  generateContrastiveFeedback,
  buildMasteryMap,
  resolveFeatureStatuses,
  updateMasteryAfterAttempt,
  emptyMastery,
} from '@/lib/accent/rp'
import { saveAccentAttempt, getUserFeatureMastery, upsertFeatureMastery } from '@/lib/db/queries'
import { awardGamification } from '@/lib/gamification/award'
import type { FeatureMasteryRecord } from '@/lib/accent/rp/types'

function rowToRecord(row: {
  featureId: string
  masteryScore: number
  bestScore: number
  status: string
  attemptCount: number
  lastPracticedAt: Date | null
  nextReviewAt: Date | null
}): FeatureMasteryRecord {
  return {
    featureId: row.featureId,
    masteryScore: row.masteryScore,
    bestScore: row.bestScore,
    status: row.status as FeatureMasteryRecord['status'],
    attemptCount: row.attemptCount,
    lastPracticedAt: row.lastPracticedAt,
    nextReviewAt: row.nextReviewAt,
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      featureId,
      phraseId,
      audioBase64,
      mimeType = 'audio/webm',
      durationSeconds,
    } = body as {
      featureId: string
      phraseId: string
      audioBase64: string
      mimeType?: string
      durationSeconds?: number
    }

    const feature = getRPFeature(featureId)
    const phrase = getPracticePhrase(featureId, phraseId)
    if (!feature || !phrase) {
      return NextResponse.json({ error: 'Unknown feature or phrase' }, { status: 400 })
    }

    if (!audioBase64) {
      return NextResponse.json({ error: 'Missing audio' }, { status: 400 })
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64')
    if (audioBuffer.length < 100) {
      return NextResponse.json({ error: 'Recording too short. Please speak the full phrase.' }, { status: 422 })
    }

    const expected = phrase.text
    const transcription = await transcribeAccentAudio(audioBuffer, mimeType, durationSeconds)
    if (!transcription.text) {
      return NextResponse.json({ error: 'No speech detected.' }, { status: 422 })
    }

    const duration =
      transcription.durationSeconds ||
      durationSeconds ||
      Math.max(1, transcription.segments.at(-1)?.end ?? 1)

    const { wordScores, accuracy } = scoreTranscription(expected, transcription.text)
    const fluency = buildFluencyAnalysis(transcription.text, duration, transcription.segments)
    const phonetics = await analyzePhonetics({
      expected,
      transcribed: transcription.text,
      accent: 'british',
      wordScores,
    })

    const contrastive = await generateContrastiveFeedback({
      feature,
      expected,
      transcribed: transcription.text,
      focusWords: phrase.focusWords,
      phonetics,
      fluency,
      wordMatchScore: accuracy,
    })

    const phraseKey = `rp:${featureId}:${phraseId}`
    await saveAccentAttempt({
      id: randomUUID(),
      userId: session.user.id,
      phraseId: phraseKey,
      accent: 'british',
      mode: 'shadowing',
      accuracy: contrastive.featureScore,
      transcribed: transcription.text,
      wordScores: phonetics.words,
      metrics: {
        fluencyScore: Math.max(0, 100 - fluency.fillerRate * 2),
        pronunciationScore: contrastive.featureScore,
        wordsPerMinute: fluency.wordsPerMinute,
        totalFillers: fluency.totalFillers,
        pauseCount: fluency.pauses.length,
        featureId,
        featureScore: contrastive.featureScore,
        passedFeature: contrastive.passedFeature,
      },
    })

    const dbRows = await getUserFeatureMastery(session.user.id)
    const records = dbRows.map(rowToRecord)
    const map = resolveFeatureStatuses(buildMasteryMap(records))
    const current = map.get(featureId) ?? emptyMastery(featureId, 'in_progress')
    const updated = updateMasteryAfterAttempt(current, contrastive.featureScore)

    await upsertFeatureMastery({
      id: randomUUID(),
      userId: session.user.id,
      accentTarget: 'rp',
      featureId,
      masteryScore: updated.masteryScore,
      bestScore: updated.bestScore,
      status: updated.status,
      attemptCount: updated.attemptCount,
      lastPracticedAt: updated.lastPracticedAt!,
      nextReviewAt: updated.nextReviewAt,
    })

    const gamification = await awardGamification(session.user.id, {
      type: 'rp_feature',
      accuracy: contrastive.featureScore,
      featureId,
      featureMastered: updated.status === 'mastered' && current.status !== 'mastered',
    })

    return NextResponse.json({
      transcribed: transcription.text,
      expected,
      contrastive,
      mastery: updated,
      fluency,
      gamification,
    })
  } catch (err) {
    console.error('[accent/rp/practice]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Practice scoring failed' },
      { status: 500 }
    )
  }
}
