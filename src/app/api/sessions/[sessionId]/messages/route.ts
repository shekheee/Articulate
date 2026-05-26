import { auth } from '@/lib/auth/auth'
import { addMessage } from '@/lib/db/queries'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

// POST /api/sessions/[sessionId]/messages
export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId } = await params
  const { role, content, order } = await req.json()

  if (!role || !content || order === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const message = await addMessage({
    id: randomUUID(),
    sessionId,
    role,
    content,
    order,
  })

  return NextResponse.json(message, { status: 201 })
}
