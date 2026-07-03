'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TranscriptView } from '@/components/interview/TranscriptView'
import { WaveformVisualizer } from '@/components/interview/WaveformVisualizer'
import { useGeminiLive } from '@/hooks/useGeminiLive'
import { useTextInterview } from '@/hooks/useTextInterview'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import { showGamificationCelebrations } from '@/lib/gamification/celebrate'
import type { InterviewSession } from '@/lib/db/schema'
import type { InterviewType, Persona, Difficulty } from '@/lib/ai/prompts'

interface TranscriptMessage {
  id: string
  role: 'ai' | 'user'
  content: string
}

interface InterviewRoomProps {
  session: InterviewSession
  userName: string
  personaLabel: string
  typeLabel: string
}

type Mode = 'voice' | 'text'

export function InterviewRoom({ session, userName, personaLabel, typeLabel }: InterviewRoomProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('voice')
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [started, setStarted] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const msgOrderRef = useRef(0)
  const getSpeakingDataRef = useRef<(() => { transcripts: string[]; durationSeconds: number }) | null>(null)

  const systemPrompt = buildSystemPrompt(
    session.type as InterviewType,
    session.persona as Persona,
    session.difficulty as Difficulty,
    session.questionCount,
    session.company ?? 'generic',
    session.round ?? 'general',
    session.resumeContext,
    session.customQuestions as string[] | null
  )

  const saveMessage = useCallback(
    async (role: 'ai' | 'user', content: string) => {
      const res = await fetch(`/api/sessions/${session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, order: msgOrderRef.current++ }),
      })
      if (!res.ok) {
        console.error('[saveMessage] Failed to save message:', res.status, await res.text())
      }
    },
    [session.id]
  )

  const addToTranscript = useCallback((role: 'ai' | 'user', content: string) => {
    setTranscript((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ])
  }, [])

  const handleInterviewComplete = useCallback(async () => {
    if (finishing) return
    setFinishing(true)
    try {
      const speakingData = mode === 'voice' ? getSpeakingDataRef.current?.() : undefined
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, speakingData }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.gamification) {
        showGamificationCelebrations({
          xpEarned: data.gamification.xpEarned,
          leveledUp: data.gamification.leveledUp,
          newLevel: data.gamification.newLevel,
          newBadges: data.gamification.newBadges,
          dailyGoalMet: data.gamification.dailyGoalMet,
        })
      }
      router.push(`/feedback/${session.id}`)
    } catch {
      setFinishing(false)
    }
  }, [finishing, session.id, router, mode])

  // ── Voice mode (Gemini Live) ──
  const { status: liveStatus, isMicActive, isUserSpeaking, isAISpeaking, connect, disconnect, interrupt, getSpeakingData, takePendingUserTranscript } = useGeminiLive({
    systemPrompt,
    interviewType: session.type as InterviewType,
    persona: session.persona as Persona,
    difficulty: session.difficulty as Difficulty,
    onAITranscript: (text) => {
      addToTranscript('ai', text)
      saveMessage('ai', text)
    },
    onUserTranscript: (text) => {
      addToTranscript('user', text)
      saveMessage('user', text)
    },
    onInterviewComplete: handleInterviewComplete,
  })
  // Keep ref in sync so handleInterviewComplete can call it without circular dep
  getSpeakingDataRef.current = getSpeakingData

  // ── Text mode ──
  const {
    messages: textMessages,
    input,
    handleInputChange,
    submitAnswer,
    isLoading,
    startInterview: startTextInterview,
  } = useTextInterview({
    sessionId: session.id,
    interviewType: session.type as InterviewType,
    persona: session.persona as Persona,
    difficulty: session.difficulty as Difficulty,
    questionCount: session.questionCount,
    company: session.company ?? 'generic',
    round: session.round ?? 'general',
    resumeContext: session.resumeContext,
    customQuestions: session.customQuestions as string[] | null,
    onMessage: (role, content) => saveMessage(role, content),
    onInterviewComplete: handleInterviewComplete,
  })

  // Sync text messages into transcript
  useEffect(() => {
    if (mode !== 'text') return
    const mapped: TranscriptMessage[] = textMessages
      .filter((m) => m.content !== '__start__')
      .map((m) => ({
        id: m.id,
        role: (m.role === 'assistant' ? 'ai' : 'user') as 'ai' | 'user',
        content: m.content,
      }))
    setTranscript(mapped)
  }, [textMessages, mode])

  async function handleStart() {
    setStarted(true)
    if (mode === 'voice') {
      await connect()
    } else {
      startTextInterview()
    }
  }

  async function handleEnd() {
    // Flush any user speech that was buffered when the interview was cut short,
    // and await the DB save so it lands before evaluation reads the messages.
    if (mode === 'voice') {
      const pending = takePendingUserTranscript()
      if (pending) {
        addToTranscript('user', pending)
        await saveMessage('user', pending)
      }
    }
    disconnect()
    await handleInterviewComplete()
  }

  // isAISpeaking/isUserSpeaking come directly from the hook now

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{typeLabel} Interview</h1>
            <p className="text-muted-foreground">
              with {personaLabel} · {session.difficulty} · {session.questionCount} questions
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant={mode === 'voice' ? 'default' : 'outline'}
              onClick={() => setMode('voice')}
              className="flex-1 max-w-36"
            >
              🎤 Voice
            </Button>
            <Button
              variant={mode === 'text' ? 'default' : 'outline'}
              onClick={() => setMode('text')}
              className="flex-1 max-w-36"
            >
              ⌨️ Text
            </Button>
          </div>

          {mode === 'voice' && (
            <p className="text-sm text-muted-foreground">
              The AI will speak to you and listen to your responses in real-time. Requires microphone access.
            </p>
          )}

          <Button size="lg" className="w-full" onClick={handleStart}>
            Start Interview
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold">{typeLabel}</h1>
          <Badge variant="secondary">{personaLabel}</Badge>
          <Badge variant="outline">{session.difficulty}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'voice' && (
            <Badge
              variant={
                liveStatus === 'connected'
                  ? 'default'
                  : liveStatus === 'connecting'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {liveStatus === 'connected' ? '🔴 Live' : liveStatus === 'connecting' ? 'Connecting...' : liveStatus}
            </Badge>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEnd}
            disabled={finishing}
          >
            {finishing ? 'Evaluating...' : 'End Interview'}
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4 overflow-hidden">
        <TranscriptView
          messages={transcript}
          personaLabel={personaLabel}
          userName={userName}
        />

        <Separator className="my-4" />

        {/* Voice controls */}
        {mode === 'voice' && (
          <div className="space-y-3">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">AI</div>
                <WaveformVisualizer isActive={isAISpeaking} color="#6366f1" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">You</div>
                <WaveformVisualizer isActive={isUserSpeaking} color="#10b981" />
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={interrupt}>
                ⏸ Interrupt
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {isAISpeaking ? 'AI is speaking...' : isUserSpeaking ? 'Listening to you...' : isMicActive ? 'Ready — speak when ready' : 'AI is thinking...'}
            </p>
          </div>
        )}

        {/* Text input */}
        {mode === 'text' && (
          <form onSubmit={submitAnswer} className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Type your answer..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              autoFocus
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? '...' : 'Send'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
