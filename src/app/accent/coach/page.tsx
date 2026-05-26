'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ButtonLink } from '@/components/ui/button-link'
import { TranscriptView } from '@/components/interview/TranscriptView'
import { WaveformVisualizer } from '@/components/interview/WaveformVisualizer'
import { useGeminiLive } from '@/hooks/useGeminiLive'
import type { Accent } from '@/lib/accent/phrases'

const ACCENT_SYSTEM_PROMPTS: Record<Accent, string> = {
  british: `You are a warm and encouraging British RP (Received Pronunciation) accent coach. Have a relaxed, friendly conversation with the user on any topic they choose.

After each of the user's responses, do ONE of the following — pick the most relevant:
1. If you hear a pronunciation that differs from RP (e.g. rhotic r, flat BATH vowel, American "schedule"), point it out gently and give the correct RP version in one sentence.
2. If pronunciation was good, give brief positive reinforcement and continue the conversation naturally.

Rules:
- Give ONE tip per turn maximum — do not overwhelm.
- Keep conversation flowing naturally — you are not drilling, you are chatting.
- Suggest topics if the user is unsure: their weekend, a recent film, travel, food.
- Describe mouth/tongue position only if it helps (e.g. "for the BATH vowel, open your jaw wider and let the sound come from the back of your mouth").
- Speak in British RP yourself — your speech is the model.
- Do not evaluate overall performance or give scores.
- Format responses as plain conversational text.`,

  irish: `You are a warm and encouraging Irish English accent coach. Have a relaxed, friendly conversation with the user on any topic they choose.

After each of the user's responses, do ONE of the following — pick the most relevant:
1. If you hear a pronunciation that differs from Irish English (e.g. non-rhotic r, the th→t/d shift missed, American vowels), point it out gently and show the Irish version in one sentence.
2. If pronunciation was good, give brief positive reinforcement and continue the conversation naturally.

Rules:
- Give ONE tip per turn maximum — do not overwhelm.
- Keep conversation flowing naturally — you are chatting, not drilling.
- Suggest topics if the user is unsure: GAA, Irish weather, food, places they've visited.
- Describe the sound clearly (e.g. "in Irish, the 'r' in 'car' is clearly pronounced — let it colour the vowel before it").
- Speak with an Irish accent yourself — your speech is the model.
- Do not evaluate overall performance or give scores.
- Format responses as plain conversational text.`,
}

interface TranscriptMessage { id: string; role: 'ai' | 'user'; content: string }

export default function CoachPage() {
  const params = useSearchParams()
  const accent = (params.get('accent') ?? 'british') as Accent
  const [started, setStarted] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])

  const addToTranscript = useCallback((role: 'ai' | 'user', content: string) => {
    setTranscript((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, role, content }])
  }, [])

  const { status, isMicActive, isUserSpeaking, isAISpeaking, connect, disconnect, interrupt } = useGeminiLive({
    systemPrompt: ACCENT_SYSTEM_PROMPTS[accent],
    interviewType: 'behavioral', // needed for hook type — not used in prompt
    persona: 'friendly',
    difficulty: 'mid',
    onAITranscript: (text) => addToTranscript('ai', text),
    onUserTranscript: (text) => addToTranscript('user', text),
  })

  const accentLabel = accent === 'british' ? '🇬🇧 British RP' : '🇮🇪 Irish English'

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Accent Coach</h1>
            <p className="text-muted-foreground">{accentLabel}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Have a natural conversation and receive real-time pronunciation tips. The AI will gently guide you towards a more authentic accent.
          </p>
          <Button size="lg" className="w-full" onClick={async () => { setStarted(true); await connect() }}>
            Start Conversation 🎤
          </Button>
          <ButtonLink href="/accent" variant="ghost" className="w-full">← Back</ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold">Accent Coach</h1>
          <Badge variant="secondary">{accentLabel}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={status === 'connected' ? 'default' : status === 'connecting' ? 'secondary' : 'destructive'}
          >
            {status === 'connected' ? '🔴 Live' : status === 'connecting' ? 'Connecting...' : status}
          </Badge>
          <Button variant="destructive" size="sm" onClick={() => { disconnect(); setStarted(false) }}>
            End
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4 overflow-hidden">
        <TranscriptView messages={transcript} personaLabel={accentLabel} userName="You" />
        <Separator className="my-4" />
        <div className="space-y-3">
          <WaveformVisualizer isActive={isMicActive} />
          {isAISpeaking && (
            <Button variant="outline" size="sm" className="w-full" onClick={interrupt}>
              Interrupt
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground">
            {status === 'connected'
              ? isMicActive
                ? 'Speak naturally — the coach will respond'
                : 'Waiting for coach to finish...'
              : 'Connecting...'}
          </p>
        </div>
      </div>
    </div>
  )
}
