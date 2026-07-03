import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import { transcribeAccentAudio } from '@/lib/accent/transcribe'
import { buildFluencyAnalysis } from '@/lib/accent/fluency'

/** Lightweight STT endpoint for diagnostics / testing. */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { audioBase64, mimeType = 'audio/webm', durationSeconds } = await req.json()
    if (!audioBase64) {
      return NextResponse.json({ error: 'Missing audioBase64' }, { status: 400 })
    }

    const buffer = Buffer.from(audioBase64, 'base64')
    const transcription = await transcribeAccentAudio(buffer, mimeType, durationSeconds)
    const fluency = buildFluencyAnalysis(
      transcription.text,
      transcription.durationSeconds || durationSeconds || 1,
      transcription.segments
    )

    return NextResponse.json({
      text: transcription.text,
      provider: transcription.provider,
      segments: transcription.segments,
      fluency,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transcription failed'
    const clientError =
      /too short|empty|no speech|could not transcribe|check your microphone/i.test(message)
    return NextResponse.json({ error: message }, { status: clientError ? 422 : 500 })
  }
}
