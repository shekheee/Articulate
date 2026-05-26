import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text, voice = 'onyx' } = await req.json()
  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  const ttsStream = await openai.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
    response_format: 'mp3',
  })

  const buffer = Buffer.from(await ttsStream.arrayBuffer())
  return new Response(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
    },
  })
}
