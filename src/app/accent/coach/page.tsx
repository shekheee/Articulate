'use client'

import { useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ButtonLink } from '@/components/ui/button-link'
import { TranscriptView } from '@/components/interview/TranscriptView'
import { WaveformVisualizer } from '@/components/interview/WaveformVisualizer'
import { useGeminiLive } from '@/hooks/useGeminiLive'
import { buildCoachSystemPrompt } from '@/lib/accent/coach-prompts'
import { CoachSummaryPanel, type CoachSummary } from '@/components/accent/CoachSummaryPanel'
import type { Accent } from '@/lib/accent/phrases'

interface TranscriptMessage { id: string; role: 'ai' | 'user'; content: string }

function CoachPageContent() {
  const params = useSearchParams()
  const accent = (params.get('accent') ?? 'british') as Accent
  const [started, setStarted] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [summary, setSummary] = useState<CoachSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const addToTranscript = useCallback((role: 'ai' | 'user', content: string) => {
    setTranscript((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, role, content }])
  }, [])

  const { status, isMicActive, isAISpeaking, connect, disconnect, interrupt, getSpeakingData, takePendingUserTranscript } = useGeminiLive({
    systemPrompt: buildCoachSystemPrompt(accent),
    interviewType: 'behavioral',
    persona: 'friendly',
    difficulty: 'mid',
    onAITranscript: (text) => addToTranscript('ai', text),
    onUserTranscript: (text) => addToTranscript('user', text),
  })

  const accentLabel = accent === 'british' ? '🇬🇧 British RP' : '🇮🇪 Irish English'

  const handleEndSession = useCallback(async () => {
    setSummaryLoading(true)
    setSummaryError(null)

    const pending = takePendingUserTranscript()
    const finalTranscript = pending
      ? [...transcript, { id: `pending-${Date.now()}`, role: 'user' as const, content: pending }]
      : transcript

    const speakingData = getSpeakingData()
    disconnect()

    try {
      const res = await fetch('/api/accent/coach-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accent,
          transcript: finalTranscript.map((m) => ({ role: m.role, content: m.content })),
          speakingData,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Summary failed')
      setSummary(data)
      setStarted(false)
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Could not generate summary')
      setStarted(false)
    } finally {
      setSummaryLoading(false)
    }
  }, [accent, disconnect, getSpeakingData, takePendingUserTranscript, transcript])

  if (summary) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <CoachSummaryPanel summary={summary} />
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Accent Coach</h1>
            <p className="text-muted-foreground">{accentLabel}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Live voice conversation with pronunciation tips. When you finish, you&apos;ll get a fluency and pronunciation summary — pauses, fillers, pace, and priority improvements.
          </p>
          {summaryError && <p className="text-sm text-red-500">{summaryError}</p>}
          <Button size="lg" className="w-full" onClick={async () => { setStarted(true); setSummaryError(null); await connect() }}>
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
          <Button
            variant="destructive"
            size="sm"
            disabled={summaryLoading}
            onClick={handleEndSession}
          >
            {summaryLoading ? 'Summarising…' : 'End & Summary'}
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
                ? 'Speak naturally — one tip per turn. Tap End & Summary when done.'
                : 'Waiting for coach to finish...'
              : 'Connecting...'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CoachPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CoachPageContent />
    </Suspense>
  )
}
