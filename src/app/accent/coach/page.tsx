'use client'

import { useState, useCallback, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ButtonLink } from '@/components/ui/button-link'
import { TranscriptView } from '@/components/interview/TranscriptView'
import { WaveformVisualizer } from '@/components/interview/WaveformVisualizer'
import { useGeminiLive } from '@/hooks/useGeminiLive'
import { buildCoachSystemPrompt } from '@/lib/accent/coach-prompts'
import { CoachSummaryPanel, type CoachSummary } from '@/components/accent/CoachSummaryPanel'
import { showGamificationCelebrations } from '@/lib/gamification/celebrate'

interface TranscriptMessage { id: string; role: 'ai' | 'user'; content: string }

function CoachPageContent() {
  const [started, setStarted] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [summary, setSummary] = useState<CoachSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const addToTranscript = useCallback((role: 'ai' | 'user', content: string) => {
    setTranscript((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, role, content }])
  }, [])

  const { status, isMicActive, isAISpeaking, connect, disconnect, interrupt, getSpeakingData, takePendingUserTranscript } = useGeminiLive({
    systemPrompt: buildCoachSystemPrompt('british'),
    interviewType: 'behavioral',
    persona: 'friendly',
    difficulty: 'mid',
    onAITranscript: (text) => addToTranscript('ai', text),
    onUserTranscript: (text) => addToTranscript('user', text),
  })

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
          accent: 'british',
          transcript: finalTranscript.map((m) => ({ role: m.role, content: m.content })),
          speakingData,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Summary failed')
      if (data.gamification) {
        showGamificationCelebrations({
          xpEarned: data.gamification.xpEarned,
          leveledUp: data.gamification.leveledUp,
          newLevel: data.gamification.newLevel,
          newBadges: data.gamification.newBadges,
          dailyGoalMet: data.gamification.dailyGoalMet,
        })
      }
      setSummary(data)
      setStarted(false)
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Could not generate summary')
      setStarted(false)
    } finally {
      setSummaryLoading(false)
    }
  }, [disconnect, getSpeakingData, takePendingUserTranscript, transcript])

  if (summary) {
    return (
      <div className="min-h-screen app-mesh-bg p-4">
        <div className="max-w-2xl mx-auto py-6 space-y-4">
          <ButtonLink href="/accent" variant="ghost" size="sm">← Training path</ButtonLink>
          <CoachSummaryPanel summary={summary} />
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen app-mesh-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="glass-card p-6 text-center space-y-4">
            <div className="space-y-2">
              <span className="text-4xl">🇬🇧</span>
              <h1 className="text-2xl font-bold">RP Conversation Coach</h1>
              <Badge variant="secondary">Live Gemini voice</Badge>
            </div>
            <p className="text-sm text-muted-foreground text-left">
              Free conversation in British RP. The coach models target features (BATH split, silent R, GOAT diphthong, prosody) and gives one specific tip per turn. End the session for an RP-focused fluency summary.
            </p>
            {summaryError && <p className="text-sm text-red-500">{summaryError}</p>}
            <Button size="lg" className="w-full" onClick={async () => { setStarted(true); setSummaryError(null); await connect() }}>
              Start RP conversation 🎤
            </Button>
            <ButtonLink href="/accent" variant="outline" className="w-full">← Back to training path</ButtonLink>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen app-mesh-bg flex flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold">RP Coach</h1>
          <Badge variant="secondary">🇬🇧 British RP</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === 'connected' ? 'default' : 'secondary'}>
            {status === 'connected' ? '🔴 Live' : status === 'connecting' ? 'Connecting…' : status}
          </Badge>
          <Button variant="destructive" size="sm" disabled={summaryLoading} onClick={handleEndSession}>
            {summaryLoading ? 'Summarising…' : 'End & RP summary'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4 overflow-hidden">
        <TranscriptView messages={transcript} personaLabel="RP Coach" userName="You" />
        <Separator className="my-4" />
        <div className="space-y-3">
          <WaveformVisualizer isActive={isMicActive} />
          {isAISpeaking && (
            <Button variant="outline" size="sm" className="w-full" onClick={interrupt}>
              Interrupt
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground">
            One RP tip per turn — tap End when finished for your feature summary.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CoachPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <CoachPageContent />
    </Suspense>
  )
}
