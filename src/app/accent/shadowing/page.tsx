'use client'

import { useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ButtonLink } from '@/components/ui/button-link'
import { AudioPlaybackQueue } from '@/lib/voice/playback'
import { getPhrases, type AccentPhrase, type Accent } from '@/lib/accent/phrases'
import { useAccentPractice } from '@/hooks/useAccentPractice'
import type { ScoreResult } from '@/hooks/useAccentPractice'

function WordHighlight({ wordScores }: { wordScores: ScoreResult['wordScores'] }) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {wordScores.map((w, i) => {
        const bg =
          w.score >= 85 ? 'bg-green-100 text-green-800 border-green-200' :
          w.score >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
          'bg-red-100 text-red-800 border-red-200'
        return (
          <span key={i} className={`rounded-md border px-2 py-0.5 text-sm font-medium ${bg}`}>
            {w.word}
            <span className="text-xs opacity-70 ml-1">{w.score}%</span>
          </span>
        )
      })}
    </div>
  )
}

function ShadowingPageContent() {
  const params = useSearchParams()
  const accent = (params.get('accent') ?? 'british') as Accent
  const phrases = getPhrases(accent)

  const [phraseIdx, setPhraseIdx] = useState(0)
  const [sessionScores, setSessionScores] = useState<number[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const queueRef = useRef<AudioPlaybackQueue | null>(null)

  const { recordingState, result, error, startRecording, stopRecording, reset } = useAccentPractice(accent)

  const currentPhrase: AccentPhrase | undefined = phrases[phraseIdx]

  const playPhrase = useCallback(async () => {
    if (!currentPhrase || isPlaying) return
    setIsPlaying(true)
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext()
        queueRef.current = new AudioPlaybackQueue(audioCtxRef.current, 24000)
      }
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume()

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentPhrase.text, voice: 'nova' }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const arrayBuffer = await res.arrayBuffer()
      // Decode mp3 via AudioContext
      const decoded = await audioCtxRef.current.decodeAudioData(arrayBuffer)
      const source = audioCtxRef.current.createBufferSource()
      source.buffer = decoded
      source.connect(audioCtxRef.current.destination)
      source.start()
      source.onended = () => {
        setIsPlaying(false)
        setHasPlayed(true)
      }
    } catch {
      setIsPlaying(false)
    }
  }, [currentPhrase, isPlaying])

  const handleRecord = useCallback(() => {
    if (!currentPhrase) return
    startRecording(currentPhrase.id, currentPhrase.text, 'shadowing', (r) => {
      setSessionScores((prev) => [...prev, r.accuracy])
    })
  }, [currentPhrase, startRecording])

  const handleStopEarly = useCallback(() => {
    if (!currentPhrase) return
    stopRecording(currentPhrase.id, currentPhrase.text, 'shadowing')
  }, [currentPhrase, stopRecording])

  const handleNext = useCallback(() => {
    reset()
    setHasPlayed(false)
    setPhraseIdx((i) => Math.min(i + 1, phrases.length - 1))
  }, [reset, phrases.length])

  const handlePrev = useCallback(() => {
    reset()
    setHasPlayed(false)
    setPhraseIdx((i) => Math.max(i - 1, 0))
  }, [reset])

  const sessionAvg =
    sessionScores.length > 0
      ? Math.round(sessionScores.reduce((s, v) => s + v, 0) / sessionScores.length)
      : null

  const accentLabel = accent === 'british' ? '🇬🇧 British RP' : '🇮🇪 Irish English'

  if (!currentPhrase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No phrases found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-xl mx-auto py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Shadowing</h1>
            <p className="text-muted-foreground text-sm">{accentLabel}</p>
          </div>
          <ButtonLink href="/accent" variant="outline" size="sm">← Back</ButtonLink>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Phrase {phraseIdx + 1} of {phrases.length}</span>
            {sessionAvg !== null && <span>Session avg: <strong>{sessionAvg}%</strong></span>}
          </div>
          <Progress value={((phraseIdx + 1) / phrases.length) * 100} className="h-1.5" />
        </div>

        {/* Phrase card */}
        <Card>
          <CardContent className="py-6 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{currentPhrase.featureLabel}</Badge>
              <Badge variant="secondary" className="text-xs">Level {currentPhrase.level}</Badge>
            </div>

            <p className="text-xl font-medium text-center leading-relaxed">
              &ldquo;{currentPhrase.text}&rdquo;
            </p>

            {/* Step 1: listen */}
            <Button
              onClick={playPhrase}
              disabled={isPlaying || recordingState === 'recording' || recordingState === 'processing'}
              className="w-full"
              variant={hasPlayed ? 'outline' : 'default'}
            >
              {isPlaying ? '▶ Playing...' : hasPlayed ? '🔁 Play again' : '▶ Listen'}
            </Button>

            {/* Step 2: record */}
            {hasPlayed && (
              <>
                {recordingState === 'idle' || recordingState === 'done' || recordingState === 'error' ? (
                  <Button onClick={handleRecord} className="w-full" variant="default">
                    🎤 {recordingState === 'done' ? 'Try again' : 'Repeat now'}
                  </Button>
                ) : recordingState === 'recording' ? (
                  <Button onClick={handleStopEarly} className="w-full" variant="secondary">
                    ⏹ Stop early
                  </Button>
                ) : (
                  <Button disabled className="w-full">Analysing...</Button>
                )}
              </>
            )}

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card>
            <CardContent className="py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Your attempt</span>
                <span className={`text-xl font-bold ${result.accuracy >= 75 ? 'text-green-600' : result.accuracy >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {result.accuracy}%
                </span>
              </div>

              <WordHighlight wordScores={result.wordScores} />

              <div className="text-xs text-muted-foreground text-center">
                Whisper heard: &ldquo;{result.transcribed}&rdquo;
              </div>

              {/* Tip */}
              <div className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Tip: </span>{currentPhrase.tip}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handlePrev} disabled={phraseIdx === 0}>
            ← Previous
          </Button>
          <Button className="flex-1" onClick={handleNext} disabled={phraseIdx === phrases.length - 1}>
            Next →
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ShadowingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ShadowingPageContent />
    </Suspense>
  )
}
