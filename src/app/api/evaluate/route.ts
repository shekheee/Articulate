import { auth } from '@/lib/auth/auth'
import { runEvaluation, analyzeSpeaking } from '@/lib/ai/evaluate'
import { getMessages, getSession, saveEvaluation, completeSession } from '@/lib/db/queries'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import type { InterviewType, Persona } from '@/lib/ai/prompts'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId, speakingData } = await req.json()
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  const interviewSession = await getSession(sessionId)
  if (!interviewSession || interviewSession.userId !== session.user.id) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const messages = await getMessages(sessionId)
  const transcript = messages.map((m) => ({ role: m.role as 'ai' | 'user', content: m.content }))

  if (transcript.length < 2) {
    return NextResponse.json(
      { error: 'Not enough transcript data to evaluate. Make sure messages are being saved during the interview.' },
      { status: 422 }
    )
  }

  const speakingMetrics =
    speakingData?.transcripts?.length > 0 || speakingData?.allText
      ? analyzeSpeaking(
          speakingData.transcripts ?? [],
          speakingData.durationSeconds ?? 0,
          { allText: speakingData.allText, pauseCount: speakingData.pauseCount }
        )
      : undefined

  const evaluation = await runEvaluation(
    interviewSession.type as InterviewType,
    interviewSession.persona as Persona,
    transcript,
    speakingMetrics,
    interviewSession.round ?? undefined
  )

  const saved = await saveEvaluation({
    id: randomUUID(),
    sessionId,
    clarityScore: Math.round(evaluation.clarityScore),
    structureScore: Math.round(evaluation.structureScore),
    confidenceScore: Math.round(evaluation.confidenceScore),
    depthScore: Math.round(evaluation.depthScore),
    fluencyScore: Math.round(evaluation.fluencyScore ?? 0),
    overallScore: Math.round(evaluation.overallScore),
    strengths: evaluation.strengths,
    weaknesses: evaluation.weaknesses,
    suggestions: evaluation.suggestions,
    speakingCoaching: evaluation.speakingCoaching ?? [],
    perQuestion: evaluation.perQuestion,
    speakingMetrics: speakingMetrics ?? null,
  })

  await completeSession(sessionId, Math.round(evaluation.overallScore))

  return NextResponse.json(saved)
}
