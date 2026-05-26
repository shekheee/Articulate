import { auth } from '@/lib/auth/auth'
import { getSession } from '@/lib/db/queries'
import { redirect, notFound } from 'next/navigation'
import { InterviewRoom } from './InterviewRoom'

const PERSONA_LABELS: Record<string, string> = {
  google: 'Google SWE',
  amazon: 'Amazon Bar Raiser',
  startup: 'Startup Founder',
  strict: 'Strict Interviewer',
  friendly: 'Friendly Mentor',
}

const TYPE_LABELS: Record<string, string> = {
  behavioral: 'Behavioral',
  dsa: 'DSA / Coding',
  system_design: 'System Design',
}

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const { sessionId } = await params
  const session = await getSession(sessionId)

  if (!session || session.userId !== authSession.user.id) notFound()
  if (session.status === 'completed') redirect(`/feedback/${sessionId}`)

  return (
    <InterviewRoom
      session={session}
      userName={authSession.user.name ?? 'You'}
      personaLabel={PERSONA_LABELS[session.persona] ?? session.persona}
      typeLabel={TYPE_LABELS[session.type] ?? session.type}
    />
  )
}
