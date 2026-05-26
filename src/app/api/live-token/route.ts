import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

// Returns the Gemini API key to authenticated users for use in the Live WebSocket.
// The key is gated behind auth so it's never exposed to unauthenticated requests.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 })
  }

  return NextResponse.json({ token: apiKey })
}
