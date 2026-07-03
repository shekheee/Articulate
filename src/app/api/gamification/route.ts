import { auth } from '@/lib/auth/auth'
import { getGamificationProfile } from '@/lib/gamification/award'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const profile = await getGamificationProfile(session.user.id)
    return NextResponse.json(profile)
  } catch (err) {
    console.error('[gamification]', err)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}
