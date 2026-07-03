import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY
  if (!key || key.startsWith('your_')) return null
  return new OpenAI({ apiKey: key })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const openai = getOpenAI()
  if (!openai) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 })
  }

  const { text, voice = 'fable' } = await req.json()
  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  try {
    const ttsStream = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text.slice(0, 4096),
      response_format: 'mp3',
    })

    const buffer = Buffer.from(await ttsStream.arrayBuffer())
    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('[tts]', err)
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
  }
}
