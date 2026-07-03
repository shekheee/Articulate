import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { analyzePhonetics } from '@/lib/accent/phonetics'
import { scoreTranscription } from '@/lib/accent/scoring'

/** Phonetics analysis endpoint for testing / tooling. */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { expected, transcribed, accent = 'british' } = await req.json()
    if (!expected || !transcribed) {
      return NextResponse.json({ error: 'expected and transcribed required' }, { status: 400 })
    }

    const { wordScores } = scoreTranscription(expected, transcribed)
    const phonetics = await analyzePhonetics({
      expected,
      transcribed,
      accent,
      wordScores,
    })

    return NextResponse.json(phonetics)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Phonetics analysis failed' },
      { status: 500 }
    )
  }
}
