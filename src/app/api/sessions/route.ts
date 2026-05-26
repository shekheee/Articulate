import { auth } from '@/lib/auth/auth'
import { createSession, getUserSessions, addMessage, getMessages, getUserResume } from '@/lib/db/queries'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const sessions = await getUserSessions(session.user.id)
  return NextResponse.json(sessions)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { type, persona, difficulty, questionCount, company, round, resumeContext: bodyResume, customQuestions } = body

  if (!type || !persona || !difficulty) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Use resume from request body if provided, otherwise fall back to user's saved resume
  const resumeContext = bodyResume ?? (await getUserResume(session.user.id))

  const newSession = await createSession({
    id: randomUUID(),
    userId: session.user.id,
    type,
    persona,
    difficulty,
    questionCount: questionCount ?? 5,
    company: company ?? 'generic',
    round: round ?? 'general',
    resumeContext,
    customQuestions: Array.isArray(customQuestions) ? customQuestions.filter(Boolean) : [],
  })

  return NextResponse.json(newSession, { status: 201 })
}
