import { auth } from '@/lib/auth/auth'
import { streamInterviewResponse } from '@/lib/ai/providers'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import type { InterviewType, Persona, Difficulty } from '@/lib/ai/prompts'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    messages,
    interviewType,
    persona,
    difficulty,
    questionCount,
    company,
    round,
    resumeContext,
    customQuestions,
  }: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    interviewType: InterviewType
    persona: Persona
    difficulty: Difficulty
    questionCount: number
    company?: string
    round?: string
    resumeContext?: string | null
    customQuestions?: string[] | null
  } = body

  if (!messages || !interviewType || !persona || !difficulty) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const system = buildSystemPrompt(
    interviewType,
    persona,
    difficulty,
    questionCount ?? 5,
    company,
    round,
    resumeContext,
    customQuestions
  )

  const result = await streamInterviewResponse(system, messages)
  return result.toTextStreamResponse()
}
