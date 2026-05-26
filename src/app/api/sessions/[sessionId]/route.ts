import { auth } from '@/lib/auth/auth'
import { getSession, deleteSession } from '@/lib/db/queries'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId } = await params
  const existing = await getSession(sessionId)
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await deleteSession(sessionId, session.user.id)
  return NextResponse.json({ ok: true })
}
